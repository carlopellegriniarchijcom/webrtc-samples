// Copyright (C) 2012 Google. All rights reserved.
// A mock JSEP implementation.
// Not filled out yet.

MockJsepPeerConnection.connectionCount = 0;
MockJsepPeerConnection.existingConnections = [];

function MockJsepPeerConnection(configuration, iceCb) {
  this.id = ++MockJsepPeerConnection.connectionCount;
  MockJsepPeerConnection.existingConnections[this.id] = this;
  this.iceCallback = iceCb;
  this.localStreams = [];
  this.remoteStreams = [];
}

MockJsepPeerConnection.prototype.createOffer = function(hints) {
  this.trace("CreateOffer");
  return new MockSessionDescription("offer from " + this.id);
}

  MockJsepPeerConnection.prototype.createAnswer = function(offer, hints) {
  this.trace("createAnswer");
  return new MockSessionDescription("answer from " + this.id);
}

MockJsepPeerConnection.prototype.setLocalDescription = function(action, desc) {
  this.trace("setLocalDescription");
  this.localDescription = desc;
}

MockJsepPeerConnection.prototype.setRemoteDescription = function(action, desc) {
  this.trace("setRemoteDescription");
  this.remoteDescription = desc;
  if (desc.toSdp().match(/ from (\d+)/)) {
    this.trace(this.id + " has " + RegExp.$1 + " as remote");
    this.remote = MockJsepPeerConnection.existingConnections[RegExp.$1];
    // Signal new streams (after this finishes).
    this.trace("Remote has " + this.remote.localStreams.length + " streams");
    for (var i = 0; i < this.remote.localStreams.length; i++) {
      if (this.remoteStreams[i] !== this.remote.localStreams[i]) {
        if (this.remoteStreams[i]) {
          this.trace("Removing stream " + i);
          this.streamRemoved(this.remoteStreams[i]);
          this.remoteStreams[i] = null;
        }
        if (this.remote.localStreams[i]) {
          this.trace("Adding stream " + i);
          this.remoteStreams[i] = this.remote.localStreams[i];
          this.streamAdded(this.remoteStreams[i]);
        }
      }
    }
  } else {
    this.error("Failed to connect with peer");
  }
}

// Helper functions for signalling stream add/removes.
MockJsepPeerConnection.prototype.streamAdded = function(stream) {
  var that = this;
  window.setTimeout(function() {
      that.trace("Signalling remote stream added");
      var e = {};
      e.stream = stream;
      that.onaddstream(e);
    },
    1);
}

MockJsepPeerConnection.prototype.streamRemoved = function(stream) {
  var that = this;
  window.setTimeout(function() {
      that.trace("Signalling remote stream removed");
      that.onremovestream(stream);
    },
    1);
}

MockJsepPeerConnection.prototype.addStream = function(stream, hints) {
  this.trace("addStream");
  this.localStreams.push(stream);
}

MockJsepPeerConnection.prototype.startIce = function(options) {
  var that = this;
  this.trace("startIce");
  this.iceState = "gathering";
  window.setTimeout(function() {
      that.trace("Providing candidate");
      that.iceState = "completed";
      that.iceCallback(new MockIceCandidate(), false);
    },
    2);
}

MockJsepPeerConnection.prototype.processIceMessage = function(candidate) {
  this.trace("processIceMessage");
  // Nothing happens.
}

MockJsepPeerConnection.prototype.close = function() {
  var i;
  for (i = 0; i < this.localStreams.length; ++i) {
    this.localStreams[i].stop();
  }
}

// Internal function: Trace what happens. This version: Console write.
MockJsepPeerConnection.prototype.trace = function(text) {
  console.log("MockJsep " + this.id + ": " + text);
}

MockJsepPeerConnection.prototype.error = function(text) {
  console.log("MockJsep " + this.id + " ERROR: " + text);
  throw("MockJsep error: " + text);
}

// Mock SessionDescription implementation
function MockSessionDescription(type) {
  this.sdp = "Fake session description of " + type;
}

MockSessionDescription.prototype.toSdp = function() {
  return this.sdp;
}

MockSessionDescription.prototype.addCandidate = function(candidate) {
  this.sdp += candidate.toSdp();
}

// Mock IceCandidate implementation
function MockIceCandidate() {
  this.sdp = "a=candidate:Fake candidate";
  this.label = "first";
}

MockIceCandidate.prototype.toSdp = function() {
  return this.sdp;
}
