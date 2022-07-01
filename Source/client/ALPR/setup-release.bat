XCOPY /y opencv\build\x64\vc15\bin\opencv_world455.dll x64\Release\opencv_world455.dll*
XCOPY /y opencv\build\x64\vc15\bin\opencv_videoio_ffmpeg455_64.dll x64\Release\opencv_videoio_ffmpeg455_64.dll*
XCOPY /y opencv\build\x64\vc15\bin\opencv_videoio_msmf455_64.dll x64\Release\opencv_videoio_msmf455_64.dll*
XCOPY /y db-18.1.40\libdb181.dll x64\Release\libdb181.dll*
XCOPY /y faker\datafile.txt x64\Release\datafile.txt*
xcopy /S /E /H /Y /I "rundata" "x64\Release"
