// this is presumably loaded from some database in the back-end (flask or node?)
var _DB = {
  crowd_name: "Bob's Donuts",
  crowd_id: "eFlOVqORasM9qspBq0gv", // fb document ID for testing
  my_id: 'anonymous', // test 1) OyHKgIOsy2BfVW69kyjf, 2) W5pJMKroXd9FeCA2NEId, 3) k5uYov4IgMMjK35QvQ9T
  my_location: [100, -70] // starting location
}

_DB.my_id = prompt('Enter my_id to connect: (Use OyHKgIOsy2BfVW69kyjf, W5pJMKroXd9FeCA2NEId, or k5uYov4IgMMjK35QvQ9T for testing)')
if (!_DB.my_id) {
  // user enters ''
  _DB.my_id = 'anonymous'
}
// only my_ids that match ones in DB will work

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
    crowd: {
      title: _DB.crowd_name
    },
    my_avatar: 'assets/img/me.png',
    me: null,
    scene: 'interstitial',
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
