#! /bin/sh

NUMBER=$((1 + $RANDOM % 18))

FILE=`ls ~/Desktop/PorchSample/*jpg | tail -$NUMBER | head -1`

cat $FILE
