// this is presumably loaded from some database in the back-end (flask or node?)
var _DB = {
  crowd_name: "Bob's Donuts",
  crowd_id: "eFlOVqORasM9qspBq0gv", // fb document ID for testing
  my_id: 'anonymous', // test 1) OyHKgIOsy2BfVW69kyjf, 2) W5pJMKroXd9FeCA2NEId, 3) k5uYov4IgMMjK35QvQ9T
  my_location: [100, -70]
}

var map = {
  inside: false
}

// Load people with firebase
var firebaseConfig = {
  apiKey: "AIzaSyA-TtymaKaQYS1LiedsCmgdj3kV5Z2TtOo",
  authDomain: "corona-crowd-cf195.firebaseapp.com",
  databaseURL: "https://corona-crowd-cf195.firebaseio.com",
  projectId: "corona-crowd-cf195",
  storageBucket: "corona-crowd-cf195.appspot.com",
  messagingSenderId: "698495134070",
  appId: "1:698495134070:web:5784b0cf5b69ecf9cef257",
  measurementId: "G-94GEBWFH9T"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

var app = new Vue({
  el: '#app',
  data: {
    inside: false,
    people: [],
    topics: [],
    crowd: {
      title: _DB.crowd_name
    },
    my_avatar: 'assets/img/me.png',
    me: null,
    scene: 'interstitial', // testing, change back to 'interstitial'
    camera_on: false,
    my_saved_location: {
      x: _DB.my_location[0],
      y: _DB.my_location[1]
    }
  },
  mounted() {
    // load the people
    // db.collection("people").where("crowd_id", "==", _DB.crowd_id)
    //     .get()
    //     .then(function(querySnapshot) {
    //         querySnapshot.forEach(function(doc) {
    //             // doc.data() is never undefined for query doc snapshots
    //             var person = doc.data()
    //             app.addPerson(person)
    //         });
    //     })
    //     .catch(function(error) {
    //         console.log("Error getting documents: ", error);
    //     });

    // listen for updates
    db.collection("topics").where("crowd_id", "==", _DB.crowd_id)
      .onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
          if (change.type === "added") {
            var topic = change.doc.data()
            console.group('Received pre-seeded topic: '+topic.name);
            console.log(topic)
            console.groupEnd()
            app.addTopic(topic)
          }
        })
      });

    db.collection("people").where("crowd_id", "==", _DB.crowd_id)
      .onSnapshot(function(snapshot) {
          snapshot.docChanges().forEach(function(change) {
              if (change.type === "added") {

                var person = change.doc.data()
                person.id = change.doc.id

                // check if me
                if (person.id == _DB.my_id) {
                  app.me = person
                }
                else {
                  app.addPerson(person)
                }
                console.log("Added person: ", change.doc.data());
              }

              // I moved
              if (change.type === "modified" && change.doc.id == _DB.my_id) {

                // need to adjust everyone else's volume
                for (var i = 0; i < app['people'].length; i++) {
                  var other_person = app['people'][i];

                  // change their remote audio

                  // updated person's location
                  var x2 = other_person['pos']['x'];
                  var y2 = other_person['pos']['y'];

                  // my new location
                  var x1 = app['my_saved_location']['x'];
                  var y1 = app['my_saved_location']['y'];

                  // calculate new volume based on distance
                  var new_volume = calculate_volume(x1, x2, y1, y2);
                  var remote_id = other_person.id;
                  adjust_volume(remote_id, new_volume);
                  if (new_volume > 3) {
                    other_person.grouped = true
                  } else {
                    other_person.grouped = false
                  }
                }

              }

              // someone else moved
              if (change.type === "modified" && change.doc.id != _DB.my_id) {
                  // find person with that ID
                  var idToLookFor = change.doc.id

                  personIndex = app['people'].findIndex(x => x.id === idToLookFor)

                  var updatedPerson = change.doc.data()

                  app.people[personIndex]['pos'] = {
                    x: updatedPerson.location[0],
                    y: updatedPerson.location[1]
                  }
                  // existingPerson = newPerson

                  // console.log(app.people[foundindex])

                  // make the changes
                  console.log("Modified person: ", change.doc.data());


                  // change their remote audio

                  // updated person's location
                  var x2 = updatedPerson.location[0];
                  var y2 = updatedPerson.location[1];

                  // my location
                  var x1 = app['my_saved_location']['x'];
                  var y1 = app['my_saved_location']['y'];

                  // calculate new volume based on distance
                  var new_volume = calculate_volume(x1, x2, y1, y2);
                  var remote_id = idToLookFor;
                  adjust_volume(remote_id, new_volume);
                  if (new_volume > 3) {
                    other_person.grouped = true
                  } else {
                    other_person.grouped = false
                  }

              }
              if (change.type === "removed") {
                  // find person with that ID
                  var idToLookFor = change.doc.id

                  personIndex = app['people'].findIndex(x => x.id === idToLookFor)
                  app['people'].splice(personIndex, 1);
                  console.log("Removed person: ", change.doc.data());
              }
          });
      });

  },
  methods: {
    closeModal() {
      if (this.scene == 'interstitial') {
        // modal cant be closed, they must take a photo to enter
      }
      else {
        // close the modal
        this.scene = 'crowd'
      }
    },
    prepareCamera() {
      // takes a photo
      Webcam.set({
        width: 320,
        height: 240,
        image_format: 'jpeg',
        jpeg_quality: 90,
        flip_horiz: true
      });
      Webcam.attach('#my_camera');
      this.camera_on = true
    },
    takeSnapshot() {
      // take snapshot and get image data
      Webcam.snap( function(data_uri) {

      // Add new user
      let newRef = db.collection('people').doc()
      var addNewPerson = newRef.set({
         avatar: data_uri,
         crowd_id: _DB.crowd_id,
         location: {0: _DB.my_location[0], 1: _DB.my_location[1]}
       });
      _DB.my_id = newRef.id
      console.log("My ID: ", _DB.my_id)

      // update local avatar
      app.my_avatar = data_uri;
    })

      // [] upload data uri to firebase/AWS as photo for processing

      // switch scene (close modal)
      this.scene = 'crowd'

      // automatically join the channel
      join(rtc, option);

    },
    addPerson(person) {
      person.pos = {
        x: person.location[0],
        y: person.location[1]
      }
      person.group = false;
      this['people'].push(person)
      console.log(this.people)
    },
    addTopic(topic) {
      this['topics'].push(topic)
      console.log(this.topics)
    },
    pushMovement(newPos) {

      // send my new movement to firebase
      var meRef = db.collection("people").doc(_DB.my_id);

      return meRef.update({
          location: {0: newPos[0], 1: newPos[1]}
      })
      .then(function() {
          console.log("Document successfully updated!");
          app.anonymous = false
      })
      .catch(function(error) {
          // The document probably doesn't exist.
          console.error("Error updating document: ", error);
          app.anonymous = true
      });
    }
  }
})

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    // Delete person in firebase on exit
    db.collection('people').doc(_DB.my_id).delete().then(function() {
      console.log("Document successfully deleted!");
    }).catch(function(error) {
      console.error("Error removing document: ", error);
    });
    e.returnValue = "";
});

// // Implement pan functionality
// var $crowd = document.querySelector('#crowdmap')
//
// let crowd = panzoom($crowd, {
//   smoothScroll: false,
//   maxZoom: 1,
//   minZoom: 1,
//   bounds: true,
//   boundsPadding: 0.1
// });
//
// function calculateNewPosition(x, y) {
//   /*
//   Calculates difference between load position (as delivered from firebase) and
//   */
//   var newPosition = [_DB.my_location[0] - x, _DB.my_location[1] - y]
//
//   return newPosition
// }
//
// // crowd.on('pan', function(e) {
// //   console.log('Fired when the `element` is being panned', e);
// // });
//
// crowd.on('panend', function(e) {
//   console.log('Fired when pan ended', e);
//
//   // update firebase with my new position
//   console.group('I have moved here:')
//   const panPosition = crowd.getTransform()
//   console.info(panPosition)
//   console.groupEnd()
//
//   newPos = calculateNewPosition(panPosition['x'], panPosition['y'])
//   console.group('Updating location in DB...')
//   console.info(newPos)
//   app.pushMovement(newPos)
//   console.groupEnd()
//
//   // check if outside
//   if (newPos[0] < -60 || newPos[1] < -60) {
//     map.inside = false
//     console.log('You left the crowd :(') // should be some audio feedback (wah wah :/)
//   }
//   else {
//     map.inside = true
//     console.log('You entered the crowd :)') // should be some audio feedback (wah wah :/)
//   }
//
//   // update stream accordingly
// });

// window.onbeforeunload = function(){
//     let deleteDoc = db.collection('people').doc(_DB.my_id).delete();
// }


// agora stuff
console.log("agora sdk version: " + AgoraRTC.VERSION + " compatible: " + AgoraRTC.checkSystemRequirements());
var resolutions = [
  {
    name: 'default',
    value: 'default',
  },
  {
    name: '480p',
    value: '480p',
  },
  {
    name: '720p',
    value: '720p',
  },
  {
    name: '1080p',
    value: '1080p'
  }
];

function Toastify (options) {
  M.toast({html: options.text, classes: options.classes});
}

var Toast = {
  info: (msg) => {
    Toastify({
      text: msg,
      classes: "info-toast"
    })
  },
  notice: (msg) => {
    Toastify({
      text: msg,
      classes: "notice-toast"
    })
  },
  error: (msg) => {
    Toastify({
      text: msg,
      classes: "error-toast"
    })
  }
};
function validator(formData, fields) {
  var keys = Object.keys(formData);
  for (let key of keys) {
    if (fields.indexOf(key) != -1) {
      if (!formData[key]) {
        Toast.error("Please Enter " + key);
        return false;
      }
    }
  }
  return true;
}

function serializeformData() {
  var formData = $("#form").serializeArray();
  var obj = {}
  for (var item of formData) {
    var key = item.name;
    var val = item.value;
    obj[key] = val;
  }
  return obj;
}

function addView (id, show) {
  if (!$("#" + id)[0]) {
    $("<div/> ", {
      id: "remote_video_panel_" + id,
      // class: "video-view",
      class: "video-view-custom",
    }).appendTo("#crowdmap");

    // // buttons for adjusting sound

    // // increases sound
    // $("<input/>", {
    //   type  : 'button',
    //   value : 'Approach',
    //   id    : 'approach_' + id,
    //   on    : {
    //     click: function() {
    //       adjust_volume(id, 10);
    //     }
    //   }
    // }).appendTo("#remote_video_panel_" + id);

    // // decreases sound
    // $("<input/>", {
    //   type  : 'button',
    //   value : 'Leave',
    //   id    : 'leave_' + id,
    //   on    : {
    //     click: function() {
    //       adjust_volume(id, -10);
    //     }
    //   }
    // }).appendTo("#remote_video_panel_" + id);


    $("<div/>", {
      id: "remote_video_" + id,
      class: "video-view-custom",
    }).appendTo("#remote_video_panel_" + id);

    $("<div/>", {
      id: "remote_video_info_" + id,
      class: "video-profile " + (show ? "" :  "hide"),
    }).appendTo("#remote_video_panel_" + id);

    $("<div/>", {
      id: "video_autoplay_"+ id,
      class: "autoplay-fallback hide",
    }).appendTo("#remote_video_panel_" + id);
  }
}
function removeView (id) {
  if ($("#remote_video_panel_" + id)[0]) {
    $("#remote_video_panel_"+id).remove();
  }
}

function getDevices (next) {
  AgoraRTC.getDevices(function (items) {
    items.filter(function (item) {
      return ['audioinput', 'videoinput'].indexOf(item.kind) !== -1
    })
    .map(function (item) {
      return {
      name: item.label,
      value: item.deviceId,
      kind: item.kind,
      }
    });
    var videos = [];
    var audios = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if ('videoinput' == item.kind) {
        var name = item.label;
        var value = item.deviceId;
        if (!name) {
          name = "camera-" + videos.length;
        }
        videos.push({
          name: name,
          value: value,
          kind: item.kind
        });
      }
      if ('audioinput' == item.kind) {
        var name = item.label;
        var value = item.deviceId;
        if (!name) {
          name = "microphone-" + audios.length;
        }
        audios.push({
          name: name,
          value: value,
          kind: item.kind
        });
      }
    }
    next({videos: videos, audios: audios});
  });
}

var rtc = {
  client: null,
  joined: false,
  published: false,
  localStream: null,
  remoteStreams: [],
  params: {}
};

function calculate_volume(x1, x2, y1, y2) {

  var distance_squared = Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2);

  const scaling = 100000; // this might need to be changed later
  var volume = scaling/distance_squared;

  console.log("calculate_volume: volume = " + volume);

  // cap on volume
  if (volume > 100) {
    volume = 100;
  }
  return volume;
}

function adjust_volume(remote_id, new_volume) {

  // can make this faster instead of using loop
  for(var i = 0; i < rtc.remoteStreams.length; i++) {
    remoteStream = rtc.remoteStreams[i];
    var id = remoteStream.getId();
    if (id == remote_id) {

      new_volume = Math.round(new_volume);

      console.log("new volume = " + new_volume);

      remoteStream.setAudioVolume(new_volume);
      console.log("Updated volume of " + remote_id + " to " + new_volume);
    }
  }
}

function handleEvents (rtc) {

  // Occurs when an error message is reported and requires error handling.
  rtc.client.on("error", (err) => {
    console.log(err)
  })

  // Occurs when the peer user leaves the channel; for example, the peer user calls Client.leave.
  rtc.client.on("peer-leave", function (evt) {
    var id = evt.uid;
    console.log("id", evt);
    if (id != rtc.params.uid) {
      removeView(id);
    }
    Toast.notice("peer leave")
    console.log('peer-leave', id);
  })

  // Occurs when the local stream is published.
  rtc.client.on("stream-published", function (evt) {
    Toast.notice("stream published success")
    console.log("stream-published");
  })

  // Occurs when the remote stream is added.
  rtc.client.on("stream-added", function (evt) {
    var remoteStream = evt.stream;
    var id = remoteStream.getId();
    Toast.info("stream-added uid: " + id)
    if (id !== rtc.params.uid) {
      rtc.client.subscribe(remoteStream, function (err) {
        console.log("stream subscribe failed", err);
      })
    }
    console.log('stream-added remote-uid: ', id);
  });

  // Occurs when a user subscribes to a remote stream.
  rtc.client.on("stream-subscribed", function (evt) {
    var remoteStream = evt.stream;
    var id = remoteStream.getId();
    rtc.remoteStreams.push(remoteStream);

    addView(id);
    remoteStream.play("remote_video_" + id);
    Toast.info('stream-subscribed remote-uid: ' + id);
    console.log('stream-subscribed remote-uid: ', id);
  })

  // Occurs when the remote stream is removed; for example, a peer user calls Client.unpublish.
  rtc.client.on("stream-removed", function (evt) {
    var remoteStream = evt.stream;
    var id = remoteStream.getId();
    Toast.info("stream-removed uid: " + id)
    remoteStream.stop("remote_video_" + id);
    rtc.remoteStreams = rtc.remoteStreams.filter(function (stream) {
      return stream.getId() !== id
    })
    removeView(id);
    console.log('stream-removed remote-uid: ', id);
  })

  rtc.client.on("onTokenPrivilegeWillExpire", function(){
    // After requesting a new token
    // rtc.client.renewToken(token);
    Toast.info("onTokenPrivilegeWillExpire")
    console.log("onTokenPrivilegeWillExpire")
  });
  rtc.client.on("onTokenPrivilegeDidExpire", function(){
    // After requesting a new token
    // client.renewToken(token);
    Toast.info("onTokenPrivilegeDidExpire")
    console.log("onTokenPrivilegeDidExpire")
  })
}

// *
//   * rtc: rtc object
//   * option: {
//   *  mode: string, 'live' | 'rtc'
//   *  codec: string, 'h264' | 'vp8'
//   *  appID: string
//   *  channel: string, channel name
//   *  uid: number
//   *  token; string,
//   * }
//  *


var option = {
  mode: 'rtc',
  codec: 'h264',
  appID: 'e9a19ca1d2c64103a6bc88ad502b8213',
  channel: 'test-channel',
  uid: _DB.my_id,
  token: '006e9a19ca1d2c64103a6bc88ad502b8213IAAnBYLtgDQulGxLxwCFJAdU2XSMpFhtYFIxM72C7lKbEmLMzZAAAAAAEACapUd9ngiFXgEAAQCeCIVe'
}

function join (rtc, option) {
  if (rtc.joined) {
    Toast.error("Your already joined");
    return;
  }

  /**
   * A class defining the properties of the config parameter in the createClient method.
   * Note:
   *    Ensure that you do not leave mode and codec as empty.
   *    Ensure that you set these properties before calling Client.join.
   *  You could find more detail here. https://docs.agora.io/en/Video/API%20Reference/web/interfaces/agorartc.clientconfig.html
  **/
  rtc.client = AgoraRTC.createClient({mode: option.mode, codec: option.codec});

  rtc.params = option;

  // handle AgoraRTC client event
  handleEvents(rtc);

  // init client
  rtc.client.init(option.appID, function () {
    console.log("init success");

    /**
     * Joins an AgoraRTC Channel
     * This method joins an AgoraRTC channel.
     * Parameters
     * tokenOrKey: string | null
     *    Low security requirements: Pass null as the parameter value.
     *    High security requirements: Pass the string of the Token or Channel Key as the parameter value. See Use Security Keys for details.
     *  channel: string
     *    A string that provides a unique channel name for the Agora session. The length must be within 64 bytes. Supported character scopes:
     *    26 lowercase English letters a-z
     *    26 uppercase English letters A-Z
     *    10 numbers 0-9
     *    Space
     *    "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", "{", "}", "|", "~", ","
     *  uid: number | null
     *    The user ID, an integer. Ensure this ID is unique. If you set the uid to null, the server assigns one and returns it in the onSuccess callback.
     *   Note:
     *      All users in the same channel should have the same type (number or string) of uid.
     *      If you use a number as the user ID, it should be a 32-bit unsigned integer with a value ranging from 0 to (232-1).
    **/

    // use firebase id as uid for agora
    rtc.client.join(option.token ? option.token : null, option.channel, _DB.my_id, function (uid) {
      Toast.notice("join channel: " + option.channel + " success, uid: " + uid);
      console.log("join channel: " + option.channel + " success, uid: " + uid);
      console.log("_DB.my_id: " + _DB.my_id);
      rtc.joined = true;

      rtc.params.uid = uid;

      // create local stream
      rtc.localStream = AgoraRTC.createStream({
        streamID: rtc.params.uid,
        audio: true,
        video: false, // no video for now
        screen: false,
        microphoneId: option.microphoneId,
        cameraId: option.cameraId
      })

      // init local stream
      rtc.localStream.init(function () {
        console.log("init local stream success");
        // play stream with html element id "local_stream"
        rtc.localStream.play("local_stream")

        // publish local stream
        publish(rtc);
      }, function (err)  {
        Toast.error("stream init failed, please open console see more detail")
        console.error("init local stream failed ", err);
      })
    }, function(err) {
      Toast.error("client join failed, please open console see more detail")
      console.error("client join failed", err)
    })
  }, (err) => {
    Toast.error("client init failed, please open console see more detail")
    console.error(err);
  });
}

function publish (rtc) {
  if (!rtc.client) {
    Toast.error("Please Join Room First");
    return;
  }
  if (rtc.published) {
    Toast.error("Your already published");
    return;
  }
  var oldState = rtc.published;

  // publish localStream
  rtc.client.publish(rtc.localStream, function (err) {
    rtc.published = oldState;
    console.log("publish failed");
    Toast.error("publish failed")
    console.error(err);
  })
  Toast.info("publish")
  rtc.published = true
}

function unpublish (rtc) {
  if (!rtc.client) {
    Toast.error("Please Join Room First");
    return;
  }
  if (!rtc.published) {
    Toast.error("Your didn't publish");
    return;
  }
  var oldState = rtc.published;
  rtc.client.unpublish(rtc.localStream, function (err) {
    rtc.published = oldState;
    console.log("unpublish failed");
    Toast.error("unpublish failed");
    console.error(err);
  })
  Toast.info("unpublish")
  rtc.published = false;
}

function leave (rtc) {
  if (!rtc.client) {
    Toast.error("Please Join First!");
    return;
  }
  if (!rtc.joined) {
    Toast.error("You are not in channel");
    return;
  }
  /**
   * Leaves an AgoraRTC Channel
   * This method enables a user to leave a channel.
   **/
  rtc.client.leave(function () {
    // stop stream
    rtc.localStream.stop();
    // close stream
    rtc.localStream.close();
    while (rtc.remoteStreams.length > 0) {
      var stream = rtc.remoteStreams.shift();
      var id = stream.getId();
      stream.stop();
      removeView(id);
    }
    rtc.localStream = null;
    rtc.remoteStreams = [];
    rtc.client = null;
    console.log("client leaves channel success");
    rtc.published = false;
    rtc.joined = false;
    Toast.notice("leave success");
  }, function (err) {
    console.log("channel leave failed");
    Toast.error("leave success");
    console.error(err);
  })
}

$(function () {
  getDevices(function (devices) {
    devices.audios.forEach(function (audio) {
      $('<option/>', {
        value: audio.value,
        text: audio.name,
      }).appendTo("#microphoneId");
    })
    devices.videos.forEach(function (video) {
      $('<option/>', {
        value: video.value,
        text: video.name,
      }).appendTo("#cameraId");
    })
    resolutions.forEach(function (resolution) {
      $('<option/>', {
        value: resolution.value,
        text: resolution.name
      }).appendTo("#cameraResolution");
    })
    M.AutoInit();
  })

  var fields = ['appID', 'channel'];

  $("#join").on("click", function (e) {
    console.log("join")
    e.preventDefault();
    var params = serializeformData();
    if (validator(params, fields)) {
      join(rtc, params);
    }
  })

  $("#publish").on("click", function (e) {
    console.log("publish")
    e.preventDefault();
    var params = serializeformData();
    if (validator(params, fields)) {
      publish(rtc);
    }
  });

  $("#unpublish").on("click", function (e) {
    console.log("unpublish")
    e.preventDefault();
    var params = serializeformData();
    if (validator(params, fields)) {
      unpublish(rtc);
    }
  });

  $("#leave").on("click", function (e) {
    console.log("leave")
    e.preventDefault();
    var params = serializeformData();
    if (validator(params, fields)) {
      leave(rtc);
    }
  })
})
