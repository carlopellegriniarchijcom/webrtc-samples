//
// Tests for the RoapOnJsep library, written for use with the google JS test
// framework.
//

// We have to fake up some functions before the library loads.
webkitPeerConnection00 = function() {
};
SessionDescription = function() {
};
// Faking the timeout function used to simulate events in the fake JSEP library.
var window = {};
var eventsToFire = [];
window.setTimeout = function(what, when) {
  eventsToFire.push(what);
};

var fireAllEvents = function() {
  while (eventsToFire.length > 0) {
    var event = eventsToFire.shift();
    event();
  }
};

// Debugging the debugging: Catch the console.log function.
var console = {};
console.log = function(message) {
  // Uncomment this line for debugging the tests.
  //log(message);
}

function RoapOnJsepTest() {
  // We tell the implementation under test to use our mock functions.
  RoapConnection.JsepPeerConnectionConstructor = MockJsepPeerConnection
  RoapConnection.SessionDescriptionConstructor = MockSessionDescription
  var that = this;
  this.pc1 = null;
  this.pc2 = null;

  this.pc1Callback = function(msg) {
    // Since pc2 auto-fires when created, we can't create it until
    // we have a message for it.
    if (that.pc2 === null) {
      that.pc2 = new RoapConnection("dummy arg", that.pc2Callback);
      // Add the staged "onaddstream" callback, if any.
      that.pc2.onaddstream = that.onaddstreamCallbackForPc2;
    }
    that.pc2.processSignalingMessage(msg);
  }
  this.pc2Callback = function(msg) {
    that.pc1.processSignalingMessage(msg);
  }

  this.onaddstreamCallbackForPc2 = null;
  // Create two PeerConnection objects that embrace each other.
  this.setupPeerConnections = function() {
    that.pc1 = new RoapConnection("dummy arg", that.pc1Callback);
  };
};

registerTestSuite(RoapOnJsepTest);

// Constructs a RoapConnection object.
RoapOnJsepTest.prototype.ConstructorTest = function() {
  pc = new RoapConnection("dummy arg", function(msg) {});
};

// Runs the setup function, and verifies that it does not crash.
RoapOnJsepTest.prototype.SetupDoesNotCrashTest = function() {
  this.setupPeerConnections();
  expectThat(this.pc1.state, equals('new'));
  expectThat(this.pc2, equals(null));
};

// Connects two RoapConnections together.
RoapOnJsepTest.prototype.ConnectTest = function() {
  this.setupPeerConnections();
  fireAllEvents();
  expectThat(this.pc1.state, equals('established'));
  expectThat(this.pc2.state, equals('established'));
};

// Adds a stream to one RoapConnection, and then connects them. 
RoapOnJsepTest.prototype.StreamPassedBeforeConnectTest = function() {
  this.setupPeerConnections();
  // Since PC2 doesn't exist before setup, we have to stage it
  // in a temporary variable accessible to the function that constructs pc2.
  this.onaddstreamCallbackForPc2 = createMockFunction();
  expectCall(this.onaddstreamCallbackForPc2)(_);
  this.pc1.addStream("dummy stream");
  fireAllEvents();
  expectThat(this.pc2.peerConnection.remoteStreams.length, equals(1));
};

// Connects two RoapConnections together, and then adds a stream to one.
RoapOnJsepTest.prototype.StreamPassedAfterConnectTest = function() {
  this.setupPeerConnections();
  fireAllEvents();
  this.pc2.onaddstream = createMockFunction();
  expectCall(this.pc2.onaddstream)(_);
  this.pc1.addStream("dummy stream");
  fireAllEvents();
  expectThat(this.pc2.peerConnection.remoteStreams.length, equals(1));
};
