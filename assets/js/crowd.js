const _DB = {
  crowd_name: "Bob's Donuts",
  crowd_id: "eFlOVqORasM9qspBq0gv", // fb document ID for testing
  my_id: "W5pJMKroXd9FeCA2NEId", // test
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




var app = new Vue({
  el: '#app',
  data: {
    inside: false,
    people: [],
    me: null
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
      })
      .catch(function(error) {
          // The document probably doesn't exist.
          console.error("Error updating document: ", error);
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
  else [
    map.inside = true
  ]

  // update stream accordingly
});
