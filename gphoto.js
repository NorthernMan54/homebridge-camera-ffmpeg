'use strict';

const {
  GPhotos
} = require('upload-gphotos');
var Queue = require('better-queue');
var streamifier = require('./lib/streamifier.js');
let debug = require('debug')('ffmpeg:gphoto');

module.exports = {
  gphoto: gphoto
};

var uploadQueue = new Queue(function(upload, callback) {
  googleUpload.call(upload.that, upload, callback);
}, {
  autoResume: true,
  maxRetries: 0,
  retryDelay: 30000,
  batchDelay: 500,
  afterProcessDelay: 500
});

var gphotos;

function gphoto(cameraConfig) {
  (async () => {
    if (!gphotos) {
      gphotos = new GPhotos();
      await gphotos.signin({
        username: cameraConfig.username,
        password: cameraConfig.password
      });
      await gphotos.signin();
      debug("Logged in", gphotos);
    }
  })();
}

function googleUpload(upload, callback) {
  (async () => {
    debug("Dequeue", upload.imageBuffer.length, upload.fileName);
    (async () => {
      // streamifier.createReadStream(new Buffer ([97, 98, 99])).pipe(process.stdout);
      try {
        if (!gphotos.params) {
          await gphotos.signin();
          debug("Logged in to Google");
        }
        //        const photo = await gphotos.uploadFromStream(streamifier.createReadStream(upload.imageBuffer), upload.imageBuffer.length, upload.fileName);

        const photo = await gphotos.upload({
          stream: streamifier.createReadStream(upload.imageBuffer),
          size: upload.imageBuffer.length,
          filename: upload.fileName,
        });
        debug("Upload", photo);
        // this.log("addPhoto", photo.createdAt);
        const album =
          (await gphotos.searchAlbum({
            title: (this.cameraConfig.album ? this.cameraConfig.album : 'Camera Pictures')
          })) || (await gphotos.createAlbum({
            title: (this.cameraConfig.album ? this.cameraConfig.album : 'Camera Pictures')
          }));
        // const album = await gphotos.searchOrCreateAlbum((this.cameraConfig.album ? this.cameraConfig.album : 'Camera Pictures'));
        debug("album", album);
        debug("album name", (this.cameraConfig.album ? this.cameraConfig.album : 'Camera Pictures'));
        // this.log("searchOrCreateAlbum", photo.createdAt);
        // const id = await album.addPhoto(photo);
        const id = await album.append(photo);
        this.log("Uploaded", upload.fileName);
        this.log("id", id);
      } catch (err) {
        this.log("Error:", err);
        gphotos.params = null;
      }
      callback();
    })();
  })();
}

gphoto.prototype.upload = function(upload) {
  uploadQueue.push(upload);
};
