/*
 * Copyright (c) 2015 OpenALPR Technology, Inc.
 * Open source Automated License Plate Recognition [http://www.openalpr.com]
 *
 * This file is part of OpenALPR.
 *
 * OpenALPR is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * version 3 as published by the Free Software Foundation
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

#include <cstdio>
#include <sstream>
#include <iostream>
#include <iterator>
#include <algorithm>

#include <opencv2/core/core.hpp>
#include "opencv2/highgui/highgui.hpp"
#include "opencv2/imgproc/imgproc.hpp"
#include <opencv2\opencv.hpp>
#include <opencv2/imgproc/types_c.h>

#include "tclap/CmdLine.h"
#include "support/filesystem.h"
#include "support/timing.h"
#include "support/platform.h"
#include "video/videobuffer.h"
#include "motiondetector.h"
#include "alpr.h"
#include "./../socketio/src/sio_client.h"
#include "./../socketio/lib/websocketpp/websocketpp/base64/base64.hpp"

//#define FOR_DEBUGGING
// Socket
//#define IP "127.0.0.1"
#define PORT 6667
#define BUFSIZE 640*480
#define SKIP_CNT_MAX 3
#define DELAY_MAX 50
#define SOCKET_RESIZE_W 300
#define SOCKET_RESIZE_H 300

using namespace alpr;
using namespace std;
using namespace cv;

const std::string MAIN_WINDOW_NAME = "ALPR main window";

const bool SAVE_LAST_VIDEO_STILL = false;
const std::string LAST_VIDEO_STILL_LOCATION = "/tmp/laststill.jpg";
const std::string WEBCAM_PREFIX = "/dev/video";
MotionDetector motiondetector;
bool do_motiondetection = true;
double PCFreq = 0.0;
bool _qpcInited = false;
double _avgdur = 0;
double _fpsstart = 0;
double _avgfps = 0;
double _fps1sec = 0;
VideoWriter outputVideo;
int save;
bool outputVideoInit = false;
bool alprStopFlag = false;
bool alprDataFlag = false;
String plateData;

/**/
sio::client h;

/** Function Headers */
bool detectandshow(Alpr* alpr, cv::Mat frame, std::string region, bool writeJson);
bool is_supported_image(std::string image_file);
void SaveFrameToPng(cv::Mat param_frame);
void client_send_image(cv::Mat* frame);
static double CLOCK();
static double avgdur(double newdur);
static double avgfps();
void client_send_frame(cv::Mat* frame);

bool measureProcessingTime = false;
std::string templatePattern;

// This boolean is set to false when the user hits terminates (e.g., CTRL+C )
// so we can end infinite loops for things like video processing.
bool program_active = true;

bool detected_plate_flag = false;

void OnStopMessage(sio::event& e)
{
	std::cout << "OnStopMessage" << std::endl;
	std::cout << "e.get_message()->get_string():" << e.get_message()->get_string() << std::endl;
	
	alprStopFlag = true;
}

int main(int argc, const char** argv)
{
	std::vector<std::string> filenames;
	std::string configFile = "";
	bool outputJson = false;
	int seektoms = 0;
	bool detectRegion = false;
	std::string country;
	int topn, frameinfoon;
	bool debug_mode = false;
	const char* server_ip = "127.0.0.1";
	int skipcnt = 0;
	char text[1024] = "";
	char oFileName[100] = "";
	int i = 0;
	cv::Mat reSizeFrame;

	TCLAP::CmdLine cmd("OpenAlpr Command Line Utility", ' ', Alpr::getVersion());
	TCLAP::UnlabeledMultiArg<std::string>  fileArg("image_file", "Image containing license plates", true, "", "image_file_path");
	TCLAP::ValueArg<std::string> countryCodeArg("c", "country", "Country code to identify (either us for USA or eu for Europe).  Default=us", false, "us", "country_code");
	TCLAP::ValueArg<int> seekToMsArg("", "seek", "Seek to the specified millisecond in a video file. Default=0", false, 0, "integer_ms");
	TCLAP::ValueArg<std::string> configFileArg("", "config", "Path to the openalpr.conf file", false, "", "config_file");
	TCLAP::ValueArg<std::string> templatePatternArg("p", "pattern", "Attempt to match the plate number against a plate pattern (e.g., md for Maryland, ca for California)", false, "", "pattern code");
	TCLAP::ValueArg<int> topNArg("n", "topn", "Max number of possible plate numbers to return.  Default=10", false, 1, "topN");
	TCLAP::ValueArg<int> saveFile("s", "saveFile", "Save File Type  Default=No Save", false, 0, "saveFile");
	TCLAP::ValueArg<int> configFrame("f", "configFrame", "configFrame Type  Default=Frame Info Off", false, 0, "configFrame");

	TCLAP::SwitchArg jsonSwitch("j", "json", "Output recognition results in JSON format.  Default=off", cmd, false);
	TCLAP::SwitchArg debugSwitch("", "debug", "Enable debug output.  Default=off", cmd, false);
	TCLAP::SwitchArg detectRegionSwitch("d", "detect_region", "Attempt to detect the region of the plate image.  [Experimental]  Default=off", cmd, false);
	TCLAP::SwitchArg clockSwitch("", "clock", "Measure/print the total time to process image and all plates.  Default=off", cmd, false);
	TCLAP::SwitchArg motiondetect("", "motion", "Use motion detection on video file or stream.  Default=off", cmd, false);

	try
	{
		cmd.add(templatePatternArg);
		cmd.add(seekToMsArg);
		cmd.add(topNArg);
		cmd.add(saveFile);
		cmd.add(configFrame);
		cmd.add(configFileArg);
		cmd.add(fileArg);
		cmd.add(countryCodeArg);

		if (cmd.parse(argc, argv) == false)
		{
			// Error occurred while parsing.  Exit now.
			return 1;
		}

		filenames = fileArg.getValue();
		country = countryCodeArg.getValue();
		seektoms = seekToMsArg.getValue();
		outputJson = jsonSwitch.getValue();
		debug_mode = debugSwitch.getValue();
		configFile = configFileArg.getValue();
		detectRegion = detectRegionSwitch.getValue();
		templatePattern = templatePatternArg.getValue();
		topn = topNArg.getValue();
		save = saveFile.getValue();
		frameinfoon = configFrame.getValue();
		measureProcessingTime = clockSwitch.getValue();
		do_motiondetection = motiondetect.getValue();
#if 0
		for (i = 0;i < filenames.size();i++) {
			std::cout << "i:" << i << "filenames: " << filenames[i] << std::endl;
		}

		std::cout << "country: " << country << std::endl;
		std::cout << "seektoms: " << seektoms << std::endl;
		std::cout << "outputJson: " << outputJson << std::endl;
		std::cout << "debug_mode: " << debug_mode << std::endl;
		std::cout << "configFile: " << configFile << std::endl;
		std::cout << "detectRegion: " << detectRegion << std::endl;
		std::cout << "templatePattern: " << templatePattern << std::endl;
		std::cout << "topn: " << topn << std::endl;
		std::cout << "measureProcessingTime: " << measureProcessingTime << std::endl;
		std::cout << "do_motiondetection: " << do_motiondetection << std::endl;
		std::cout << "saveFile: " << save << std::endl;
#endif
	}
	catch (TCLAP::ArgException& e)    // catch any exceptions
	{
		std::cerr << "error: " << e.error() << " for arg " << e.argId() << std::endl;
		return 1;
	}

	cv::Mat frame;

	Alpr alpr(country, configFile);
	alpr.setTopN(topn);
	time_t curTime = time(NULL);

	struct tm pLocal;
#if defined(_WIN32) || defined(_WIN64) 
	localtime_s(&pLocal, &curTime);
#else 
	localtime_r(&curTime, pLocal);
#endif 

	if (debug_mode)
	{
		alpr.getConfig()->setDebug(true);
	}

	if (detectRegion)
		alpr.setDetectRegion(detectRegion);

	if (templatePattern.empty() == false)
		alpr.setDefaultRegion(templatePattern);

	if (alpr.isLoaded() == false)
	{
		std::cerr << "Error loading OpenALPR" << std::endl;
		return 1;
	}

	h.connect("https://localhost:4000");
	h.socket()->on("stopAlpr", &OnStopMessage);


	for (unsigned int i = 0; i < filenames.size(); i++)
	{
		std::string filename = filenames[i];

		if (filename == "-")
		{
			std::vector<uchar> data;
			int c;

			while ((c = fgetc(stdin)) != EOF)
			{
				data.push_back((uchar)c);
			}

			frame = cv::imdecode(cv::Mat(data), 1);
			if (!frame.empty())
			{
				detected_plate_flag = false;
				detectandshow(&alpr, frame, "", outputJson);
			}
			else
			{
				std::cerr << "Image invalid: " << filename << std::endl;
			}
		}
		else if (filename == "stdin")
		{
			std::string filename;
			while (std::getline(std::cin, filename))
			{
				if (fileExists(filename.c_str()))
				{
					frame = cv::imread(filename);
					detected_plate_flag = false;
					detectandshow(&alpr, frame, "", outputJson);
				}
				else
				{
					std::cerr << "Image file not found: " << filename << std::endl;
				}

			}
		}
		else if (filename == "webcam" || startsWith(filename, WEBCAM_PREFIX)) /*  webcam  */
		{
			int webcamnumber = 0;

			// If they supplied "/dev/video[number]" parse the "number" here
			if (startsWith(filename, WEBCAM_PREFIX) && filename.length() > WEBCAM_PREFIX.length())
			{
				webcamnumber = atoi(filename.substr(WEBCAM_PREFIX.length()).c_str());
			}

			int framenum = 0;
			cv::VideoCapture cap(webcamnumber);
			if (!cap.isOpened())
			{
				std::cerr << "Error opening webcam" << std::endl;
				return 1;
			}

			if (save != 0)
			{
				sprintf_s(oFileName, "%04d-%02d-%02d_%02d-%02d-%02d.avi",
					pLocal.tm_year + 1900, pLocal.tm_mon + 1, pLocal.tm_mday,
					pLocal.tm_hour, pLocal.tm_min, pLocal.tm_sec);
				cout << "oFileName:" << oFileName << endl;
				outputVideo.open(oFileName, VideoWriter::fourcc('M', 'J', 'P', 'G'), 10, Size(SOCKET_RESIZE_W, SOCKET_RESIZE_H), true);
				if (!outputVideo.isOpened())
				{
					cout << "Could not open the output video for write" << endl;
					return -1;
				}
				outputVideoInit = true;
			}

			//h.connect("https://localhost:4000");

			while (cap.read(frame))
			{
				skipcnt++;
				if (skipcnt < SKIP_CNT_MAX) {
					continue;
				}
				else {
					skipcnt = 0;
				}

				if (alprStopFlag == true) break;

				Mat ori_frame = frame.clone();
				double start = CLOCK();

				if (framenum == 0)
					motiondetector.ResetMotionDetection(&frame);
#ifdef FOR_DEBUGGING
				imshow("asdf", frame);
#endif
				detected_plate_flag = false;
				detectandshow(&alpr, frame, "", outputJson);

				if (detected_plate_flag == true) {
					cv::imwrite("DetectedImage.png", frame);
					client_send_image(&frame);
				}
#ifdef FOR_DEBUGGING
				cv::waitKey(0);
#endif
				if (save == 1)
				{
					resize(frame, reSizeFrame, cv::Size(SOCKET_RESIZE_W, SOCKET_RESIZE_H), 0, 0, CV_INTER_LINEAR);
					outputVideo.write(reSizeFrame);
				}
				else if (save == 2) {
					resize(ori_frame, reSizeFrame, cv::Size(SOCKET_RESIZE_W, SOCKET_RESIZE_H), 0, 0, CV_INTER_LINEAR);
					outputVideo.write(reSizeFrame);
				}

				framenum++;

				double dur = CLOCK() - start;

				if (frameinfoon == 1) {
					cv::putText(ori_frame, text,
						cv::Point(10, ori_frame.rows - 5), //top-left position
						FONT_HERSHEY_SIMPLEX, 0.5,
						Scalar(0, 255, 0), 0, LINE_AA, false);
					sprintf_s(text, "avg time per frame %f ms. fps %f. frameno = %d", avgdur(dur), avgfps(), framenum++);
				}

				client_send_frame(&ori_frame);
				sleep_ms(DELAY_MAX);
			}
			h.close();
			cap.release();
			if (save != 0) { outputVideo.release(); }
			outputVideoInit = false;
		}
		else if (startsWith(filename, "http://") || startsWith(filename, "https://"))
		{
			int framenum = 0;

			VideoBuffer videoBuffer;

			videoBuffer.connect(filename, 5);

			cv::Mat latestFrame;

			while (program_active)
			{
				std::vector<cv::Rect> regionsOfInterest;
				int response = videoBuffer.getLatestFrame(&latestFrame, regionsOfInterest);

				if (response != -1)
				{
					if (framenum == 0)
						motiondetector.ResetMotionDetection(&latestFrame);

					detected_plate_flag = false;
					detectandshow(&alpr, latestFrame, "", outputJson);
				}

				// Sleep 10ms
				sleep_ms(10);
				framenum++;
			}

			videoBuffer.disconnect();

			std::cout << "Video processing ended" << std::endl;
		}
		else if (hasEndingInsensitive(filename, ".avi") || hasEndingInsensitive(filename, ".mp4") ||
			hasEndingInsensitive(filename, ".webm") ||
			hasEndingInsensitive(filename, ".flv") || hasEndingInsensitive(filename, ".mjpg") ||
			hasEndingInsensitive(filename, ".mjpeg") ||
			hasEndingInsensitive(filename, ".mkv")
			)
		{
			if (fileExists(filename.c_str()))
			{
				int framenum = 0;
				cv::VideoCapture cap = cv::VideoCapture();
				cap.open(filename);

				if (!cap.isOpened())
				{
					std::cerr << "Error opening video file" << std::endl;
					return 1;
				}

				cap.set(cv::CAP_PROP_POS_MSEC, seektoms);

				if (save != 0)
				{
					sprintf_s(oFileName, "%04d-%02d-%02d_%02d-%02d-%02d.avi",
						pLocal.tm_year + 1900, pLocal.tm_mon + 1, pLocal.tm_mday,
						pLocal.tm_hour, pLocal.tm_min, pLocal.tm_sec);
					cout << "oFileName:" << oFileName << endl;
					outputVideo.open(oFileName, VideoWriter::fourcc('M', 'J', 'P', 'G'), 10, Size(SOCKET_RESIZE_W, SOCKET_RESIZE_H), true);
					if (!outputVideo.isOpened())
					{
						cout << "Could not open the output video for write" << endl;
						return -1;
					}
					outputVideoInit = true;
				}

				/* video */
				while (cap.read(frame))
				{
					skipcnt++;
					if (skipcnt < SKIP_CNT_MAX) {
						continue;
					}
					else {
						skipcnt = 0;
					}

					if (alprStopFlag == true) break;

					Mat ori_frame = frame.clone();
					double start = CLOCK();

					if (SAVE_LAST_VIDEO_STILL)
					{
						cv::imwrite(LAST_VIDEO_STILL_LOCATION, frame);
					}

					if (framenum == 0)
						motiondetector.ResetMotionDetection(&frame);

#ifdef FOR_DEBUGGING
					imshow("asdf", frame);
#endif
					detected_plate_flag = false;
					detectandshow(&alpr, frame, "", outputJson);

					if (detected_plate_flag == true) {
						cv::imwrite("DetectedImage.png", frame);
						client_send_image(&frame);
					}
#ifdef FOR_DEBUGGING
					cv::waitKey(0);
#endif

					if (save == 1)
					{
						resize(frame, reSizeFrame, cv::Size(SOCKET_RESIZE_W, SOCKET_RESIZE_H), 0, 0, CV_INTER_LINEAR);
						outputVideo.write(reSizeFrame);
					}
					else if (save == 2) {
						resize(ori_frame, reSizeFrame, cv::Size(SOCKET_RESIZE_W, SOCKET_RESIZE_H), 0, 0, CV_INTER_LINEAR);
						outputVideo.write(reSizeFrame);
					}

					framenum++;

					double dur = CLOCK() - start;

					if (frameinfoon == 1) {
						cv::putText(ori_frame, text,
							cv::Point(10, ori_frame.rows - 5), //top-left position
							FONT_HERSHEY_SIMPLEX, 0.5,
							Scalar(0, 255, 0), 0, LINE_AA, false);
						sprintf_s(text, "avg time per frame %f ms. fps %f. frameno = %d", avgdur(dur), avgfps(), framenum++);
					}
					client_send_frame(&ori_frame);
					sleep_ms(DELAY_MAX);
				}
				h.close();
				cap.release();
				if (save != 0) { outputVideo.release(); }
				outputVideoInit = false;
			}
			else
			{
				std::cerr << "Video file not found: " << filename << std::endl;
			}
		}
		else if (is_supported_image(filename))
		{
			if (fileExists(filename.c_str()))
			{
				int cnt = 0;
				frame = cv::imread(filename);
				Mat ori_frame = frame.clone();

				detected_plate_flag = false;
				bool plate_found = detectandshow(&alpr, frame, "", outputJson);

				detectandshow(&alpr, frame, "", outputJson);

				if (detected_plate_flag == true) {
					cv::imwrite("DetectedImage.png", frame);
				}

				while (cnt < 10) {
					cnt++;
					client_send_image(&frame);
					client_send_frame(&ori_frame);
					sleep_ms(DELAY_MAX);
				}

				if (save != 0)
				{
					sprintf_s(oFileName, "%04d-%02d-%02d_%02d-%02d-%02d.png",
						pLocal.tm_year + 1900, pLocal.tm_mon + 1, pLocal.tm_mday,
						pLocal.tm_hour, pLocal.tm_min, pLocal.tm_sec);

					if (save == 1) {
						cv::imwrite(oFileName, frame);
					}
					else if (save == 2) {
						cv::imwrite(oFileName, ori_frame);
					}
				}
#ifdef FOR_DEBUGGING
				imshow("ori_frame", ori_frame);
				imshow("frame", frame);

				cv::waitKey(0);
#endif

				if (!plate_found && !outputJson)
					std::cout << "No license plates found." << std::endl;

				h.close();
			}
			else
			{
				std::cerr << "Image file not found: " << filename << std::endl;
			}
		}
		else if (DirectoryExists(filename.c_str()))
		{
			std::vector<std::string> files = getFilesInDir(filename.c_str());

			std::sort(files.begin(), files.end(), stringCompare);

			for (int i = 0; i < files.size(); i++)
			{
				if (is_supported_image(files[i]))
				{
					std::string fullpath = filename + "/" + files[i];
					std::cout << fullpath << std::endl;
					frame = cv::imread(fullpath.c_str());
					detected_plate_flag = false;
					if (detectandshow(&alpr, frame, "", outputJson))
					{
						//while ((char) cv::waitKey(50) != 'c') { }
					}
					else
					{
						//cv::waitKey(50);
					}
				}
			}
		}
		else
		{
			std::cerr << "Unknown file type" << std::endl;
		}
	}

	h.close();

	return 0;
}

bool is_supported_image(std::string image_file)
{
	return (hasEndingInsensitive(image_file, ".png") || hasEndingInsensitive(image_file, ".jpg") ||
		hasEndingInsensitive(image_file, ".tif") || hasEndingInsensitive(image_file, ".bmp") ||
		hasEndingInsensitive(image_file, ".jpeg") || hasEndingInsensitive(image_file, ".gif"));
}


bool detectandshow(Alpr* alpr, cv::Mat frame, std::string region, bool writeJson)
{
	timespec startTime;
	getTimeMonotonic(&startTime);

	std::vector<AlprRegionOfInterest> regionsOfInterest;
	if (do_motiondetection)
	{
		cv::Rect rectan = motiondetector.MotionDetect(&frame);
		if (rectan.width > 0) regionsOfInterest.push_back(AlprRegionOfInterest(rectan.x, rectan.y, rectan.width, rectan.height));
	}
	else regionsOfInterest.push_back(AlprRegionOfInterest(0, 0, frame.cols, frame.rows));
	AlprResults results;
	if (regionsOfInterest.size() > 0) results = alpr->recognize(frame.data, (int)frame.elemSize(), frame.cols, frame.rows, regionsOfInterest);

	timespec endTime;
	getTimeMonotonic(&endTime);
	double totalProcessingTime = diffclock(startTime, endTime);
	if (measureProcessingTime)
		std::cout << "Total Time to process image: " << totalProcessingTime << "ms." << std::endl;


	if (writeJson)
	{
		std::cout << alpr->toJson(results) << std::endl;
	}
	else
	{
		for (int i = 0; i < results.plates.size(); i++)
		{
			//std::cout << "debug" << i << ": " << results.plates[i].topNPlates.size() << " results";
			if (measureProcessingTime)
				std::cout << " -- Processing Time = " << results.plates[i].processing_time_ms << "ms.";
			//std::cout << std::endl;

			if (results.plates[i].regionConfidence > 0)
				std::cout << "State ID: " << results.plates[i].region << " (" << results.plates[i].regionConfidence << "% confidence)" << std::endl;

			for (int k = 0; k < results.plates[i].topNPlates.size(); k++)
			{
				// Replace the multiline newline character with a dash
				std::string no_newline = results.plates[i].topNPlates[k].characters;
				std::replace(no_newline.begin(), no_newline.end(), '\n', '-');

				/* */
				if (results.plates[i].topNPlates[k].overall_confidence >= 80.0f) {
					std::cout << "plate," << no_newline << "," << results.plates[i].topNPlates[k].overall_confidence;
					if (templatePattern.size() > 0 || results.plates[i].regionConfidence > 0)
						std::cout << "\t pattern_match: " << results.plates[i].topNPlates[k].matches_template;

					std::cout << std::endl;

					detected_plate_flag = true;
					std::vector<cv::Point2f> pointset;
					for (int z = 0; z < 4; z++)
						pointset.push_back(Point2i(results.plates[i].plate_points[z].x, results.plates[i].plate_points[z].y));
					cv::Rect rect = cv::boundingRect(pointset);

					//printf("i=%d rect.x=%d, rect.y=%d rect.width=%d, rect.height=%d\n", i, rect.x, rect.y, rect.width, rect.height);
					cv::rectangle(frame, rect, cv::Scalar(0, 255, 0), 2);
					break;
				}
			}
		}
	}

	return results.plates.size() > 0;
}

/***********************************************************************************/
/* InitCounter                                                                     */
/***********************************************************************************/
static void InitCounter()
{
	LARGE_INTEGER li;
	if (!QueryPerformanceFrequency(&li))
	{
		std::cout << "QueryPerformanceFrequency failed!\n";
	}
	PCFreq = double(li.QuadPart) / 1000.0f;
	_qpcInited = true;
}
/***********************************************************************************/
/* End InitCounter                                                                 */
/***********************************************************************************/
/***********************************************************************************/
/* Clock                                                                           */
/***********************************************************************************/
static double CLOCK()
{
	if (!_qpcInited) InitCounter();
	LARGE_INTEGER li;
	QueryPerformanceCounter(&li);
	return double(li.QuadPart) / PCFreq;
}
/***********************************************************************************/
/* End Clock                                                                       */
/***********************************************************************************/
/***********************************************************************************/
/* Avgdur                                                                          */
/***********************************************************************************/
static double avgdur(double newdur)
{
	_avgdur = 0.98 * _avgdur + 0.02 * newdur;
	return _avgdur;
}
/***********************************************************************************/
/* End Avgdur                                                                      */
/***********************************************************************************/
/***********************************************************************************/
/* Avgfps                                                                          */
/***********************************************************************************/
static double avgfps()
{
	if (CLOCK() - _fpsstart > 1000)
	{
		_fpsstart = CLOCK();
		_avgfps = 0.7 * _avgfps + 0.3 * _fps1sec;
		_fps1sec = 0;
	}
	_fps1sec++;
	return _avgfps;
}
/***********************************************************************************/
/*  End Avgfps                                                                     */
/***********************************************************************************/
void client_send_frame(cv::Mat* frame) {
	FILE* fp = NULL;
	cv::Mat reSizeFrame;
	std::vector<uchar> buf;

	resize(*frame, reSizeFrame, cv::Size(SOCKET_RESIZE_W, SOCKET_RESIZE_H), 0, 0, CV_INTER_LINEAR);

	cv::imencode(".png", reSizeFrame, buf);
	uchar* enc_msg = reinterpret_cast<unsigned char*>(buf.data());
	std::string encoded = websocketpp::base64_encode(enc_msg, buf.size());

	h.socket()->emit("alpr_video", encoded);
}
void client_send_image(cv::Mat* frame) {
	std::vector<uchar> buf;
	cv::Mat reSizeFrame;

	resize(*frame, reSizeFrame, cv::Size(SOCKET_RESIZE_W, SOCKET_RESIZE_H), 0, 0, CV_INTER_LINEAR);
	cv::imencode(".png", reSizeFrame, buf);
	uchar* enc_msg = reinterpret_cast<unsigned char*>(buf.data());
	std::string encoded = websocketpp::base64_encode(enc_msg, buf.size());
	h.socket()->emit("alpr_image", encoded);
}