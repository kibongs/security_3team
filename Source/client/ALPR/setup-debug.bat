XCOPY /y opencv\build\x64\vc15\bin\opencv_world455d.dll x64\Debug\opencv_world455d.dll*
XCOPY /y opencv\build\x64\vc15\bin\opencv_videoio_ffmpeg455_64.dll x64\Debug\opencv_videoio_ffmpeg455_64.dll*
XCOPY /y opencv\build\x64\vc15\bin\opencv_videoio_msmf455_64d.dll x64\Debug\opencv_videoio_msmf455_64d.dll*
XCOPY /y db-18.1.40\libdb181.dll x64\Debug\libdb181.dll*
XCOPY /y faker\datafile.txt x64\Debug\datafile.txt*
xcopy /S /E /H /Y /I "rundata" "x64\Debug"
