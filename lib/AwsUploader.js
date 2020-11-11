let debug = require('debug')('ffmpeg:aws');
let AWS = require('aws-sdk');

class AwsUploader {
  constructor(cameraConfig) {
    debug('constructor', cameraConfig);
    this.cameraConfig = cameraConfig;
    AWS.config.region = cameraConfig.awsRegion;
    AWS.config.credentials = new AWS.Credentials(cameraConfig.awsAccessKey, cameraConfig.awsSecret);
    this.rekognition = new AWS.Rekognition();
  }

  upload(imgData, callback) {
    const params = {
      Image: {
        Bytes: imgData
      },
      MaxLabels: 5, // (optional) Max number of labels with highest confidence
      MinConfidence: 0.55 // (optional) Confidence threshold from 0 to 1, default is 0.55 if left blank
    };
    this.rekognition.detectLabels(params, function(err, response) {
      if (err) {
        console.log(err, err.stack);
        callback(new Error('There was an error detecting the labels in the image provided. Check the console for more details.'));
      } else {
        // debug(data);
        // debug(displayLabels(data));
        // showBoundingBoxes(data, imgData);
        response.Labels.forEach(label => {
          debug(`Label:      ${label.Name}`);
          debug(`Confidence: ${label.Confidence}`);
          debug("Instances:");
          label.Instances.forEach(instance => {
            let box = instance.BoundingBox;
            debug("  Bounding box:");
            debug(`    Top:        ${box.Top}`);
            debug(`    Left:       ${box.Left}`);
            debug(`    Width:      ${box.Width}`);
            debug(`    Height:     ${box.Height}`);
            debug(`  Confidence: ${instance.Confidence}`);
          });
          debug("Parents:");
          label.Parents.forEach(parent => {
            debug(`  ${parent.Name}`);
          });
          debug("------------");
          debug("");
        });
        callback(null, response);
      }
    });
  }
}

module.exports = AwsUploader;

const selectedLabel = 'Person'; // label to show bounding boxes for

/**
 * Display Labels
 *
 * Shows a list of detected labels on the screen.
 */
function displayLabels(data) {
  const labels = data.Labels.map((obj) => obj.Name + ' ' + obj.Confidence).join(', ');
  return (labels);
}

/**
 * Show Bounding Boxes
 *
 * Converts ArrayBuffer into Image object
 */
function showBoundingBoxes(objData, imgData) {
  const filtered = objData.Labels.filter((obj) => selectedLabel === obj.Name);
  const boxes = filtered.length > 0 ? filtered[0].Instances : [];

  const blob = new Blob([imgData], {
    type: 'image/jpg'
  });
  const imageUrl = URL.createObjectURL(blob);

  const img = new Image();
  img.src = imageUrl;
  img.onload = function() {
    drawImage(img, boxes);
  };
}

/**
 * Draw Image
 *
 * Draws the image and bounding boxes on the canvas
 */
function drawImage(img, boxes) {
  const ctx = document.getElementById('canvas').getContext('2d');

  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.drawImage(img, 0, 0, width, height);

  boxes.forEach((obj) => {
    const box = obj.BoundingBox;
    ctx.beginPath();
    ctx.lineWidth = '2';
    ctx.strokeStyle = 'green';
    ctx.rect(box.Left * width, box.Top * height, box.Width * width, box.Height * height);
    ctx.stroke();
  });
}
