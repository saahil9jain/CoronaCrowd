// this is presumably loaded from some database in the back-end (flask or node?)
var _DB = {
  crowd_name: "Bob's Donuts",
  crowd_id: "eFlOVqORasM9qspBq0gv", // fb document ID for testing
  my_id: 'anonymous', // test 1) OyHKgIOsy2BfVW69kyjf, 2) W5pJMKroXd9FeCA2NEId, 3) k5uYov4IgMMjK35QvQ9T
  my_location: [-140, 10]
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

// _DB.my_id = prompt('Enter my_id to connect:')
// only my_ids that match ones in DB will work
let newRef = db.collection('people').doc()
var addNewPerson = newRef.set({
   avatar: "assets/img/me.png",
   crowd_id: _DB.crowd_id,
   location: {0: _DB.my_location[0], 1: _DB.my_location[1]}
 });
_DB.my_id = newRef.id
console.log("My ID: ", _DB.my_id)

// var ref = db_database.ref("people")
// var newRef = ref.push({
//   avatar: "assets/img/me.png",
//   crowd_id: _DB.crowd_id,
//   location: {0: _DB.my_location[0], 1: _DB.my_location[1]}
// });
// _DB.my_id = newRef.key;

var app = new Vue({
  el: '#app',
  data: {
    inside: false,
    people: [],
    crowd: {
      title: _DB.crowd_name
    },
    my_avatar: 'assets/img/me.png',
    me: null,
    scene: 'interstitial',
    camera_on: false
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

              }
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
              }
              if (change.type === "removed") {
                  console.log("Removed person: ", change.doc.data());
              }
          });
      });

  },
  methods: {
    prepareCamera() {
      // takes a photo
      Webcam.set({
        width: 320,
        height: 240,
        image_format: 'jpeg',
        jpeg_quality: 90
      });
      Webcam.attach('#my_camera');
      this.camera_on = true
    },
    takeSnapshot() {
      // take snapshot and get image data
      Webcam.snap( function(data_uri) {
        // update local avatar
        app.my_avatar = data_uri
      })

      // [] upload data uri to firebase/AWS as photo for processing

      // switch scene (close modal)
      this.scene = 'crowd'
    },
    addPerson(person) {
      person.pos = {
        x: person.location[0],
        y: person.location[1]
      }
      this['people'].push(person)
      console.log(this.people)
    },
    pushMovement(newPos) {
      // send my new movement to firebase
      var meRef = db.collection("people").doc(_DB.my_id);

      return meRef.update({
          location: newPos
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


// Implement pan functionality
var $crowd = document.querySelector('#crowdmap')

let crowd = panzoom($crowd, {
  smoothScroll: false,
  maxZoom: 1,
  minZoom: 1,
  bounds: true,
  boundsPadding: 0.1
});

function calculateNewPosition(x, y) {
  /*
  Calculates difference between load position (as delivered from firebase) and
  */
  var newPosition = [_DB.my_location[0] - x, _DB.my_location[1] - y]

  return newPosition
}

// crowd.on('pan', function(e) {
//   console.log('Fired when the `element` is being panned', e);
// });

crowd.on('panend', function(e) {
  console.log('Fired when pan ended', e);

  // update firebase with my new position
  console.group('I have moved here:')
  const panPosition = crowd.getTransform()
  console.info(panPosition)
  console.groupEnd()

  newPos = calculateNewPosition(panPosition['x'], panPosition['y'])
  console.group('Updating location in DB...')
  console.info(newPos)
  app.pushMovement(newPos)
  console.groupEnd()

  // check if outside
  if (newPos[0] < -60 || newPos[1] < -60) {
    map.inside = false
    console.log('You left the crowd :(') // should be some audio feedback (wah wah :/)
  }
  else {
    map.inside = true
    console.log('You entered the crowd :)') // should be some audio feedback (wah wah :/)
  }

  // update stream accordingly
});
