#!/bin/bash

INSTANCE=$1
FILENAME=$2

OS=`uname -s`
if [[ "$OS" == 'Darwin' ]]; then
  # OPTIONS=
  echo "Mac"
elif [[ "$OS" == 'Linux' ]]; then
  INPUT="-c:v h264_mmal"
  OPTIONS="-c:v h264_omx -b:v 3000000"
  echo "Linux"
fi

(
flock -e 200
cd /var/tmp
ls -tr ${INSTANCE}/* | tail -61 | head -60 | awk '{ print "file "$1 }' > ${INSTANCE}.txt

~/npm/lib/node_modules/ffmpeg-for-homebridge/ffmpeg -hide_banner -loglevel error \
-f concat ${INPUT} -i ${INSTANCE}.txt ${OPTIONS} \
-vf "mpdecimate=hi=10000:lo=600:frac=0.1,setpts=N/(15*TB)" -y ${FILENAME}
) 200>/tmp/create_movie.lockfile
