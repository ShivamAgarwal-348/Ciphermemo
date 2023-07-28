// Get references to HTML elements we need to manipulate


// Remove any previous data stored in local storage
localStorage.removeItem('deletedNotes');

let pass_hash = sessionStorage.getItem("pass_hash")
// sessionStorage.removeItem("pass_hash")
var pass_arraybuffer = new Uint8Array(pass_hash.match(/[\da-f]{2}/gi).map(function (h) {
  return parseInt(h, 16)
}))

function importSecretKey(rawKey) {
  return window.crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

importSecretKey(pass_arraybuffer).then((sym_key) => {
  const addNoteButton = document.getElementById('addNote');
  const addTitle = document.getElementById('addTitle');
  const addText = document.getElementById('addText');
  const notesDiv = document.getElementById('notes');
  const deletedNotesDiv = document.getElementById('deletedNotes');
  const archivedNotesDiv = document.getElementById('archivedNotes');

  function addNotes() {
    let notes = localStorage.getItem('notes');
    const iv_title = window.crypto.getRandomValues(new Uint8Array(12));
    const iv_text = window.crypto.getRandomValues(new Uint8Array(12));


    if (notes === null) {
      notes = [];
    } else {
      notes = JSON.parse(notes);
    }

    // Ensure that the user has entered some text before creating a note
    if (addText.value == '') {
      alert('Add your note');
      return;
    }
    // Create a new note object and add it to the list of notes
    function getMessageEncoding(message) {
      // const messageBox = document.querySelector(".aes-gcm #message");
      // const message = messageBox.value;
      const enc = new TextEncoder();
      return enc.encode(message);
    }

    function encryptMessage(key, iv_title, iv_text) {
      const encoded_text = getMessageEncoding(addText.value);
      const encoded_title = getMessageEncoding(addTitle.value);
      // iv will be needed for decryption
      return {
        ciphertitle: window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv_title }, key, encoded_title),
        ciphertext: window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv_text }, key, encoded_text),
      };
    }

    let cipher = encryptMessage(sym_key, iv_title, iv_text);

    cipher.ciphertitle.then((ciphertitle) => {
      const ciphertitle_array = Array.from(new Uint8Array(ciphertitle)); // convert buffer to byte array
      const ciphertitle_hex = ciphertitle_array
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
      // console.log(ciphertitle_hex);

      cipher.ciphertext.then((ciphertext) => {
        const cipherarray = Array.from(new Uint8Array(ciphertext)); // convert buffer to byte array
        const cipherhex = cipherarray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""); // convert bytes to hex string
        // console.log(cipherhex);

        //Converting ivs to hex

        const iv__title_array = Array.from(new Uint8Array(iv_title)); // convert buffer to byte array
        const iv__title_hex = iv__title_array
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""); // convert bytes to hex string
        const iv__text_array = Array.from(new Uint8Array(iv_text)); // convert buffer to byte array
        const iv__text_hex = iv__text_array
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""); // convert bytes to hex string

        const noteObj = {
          title: ciphertitle_hex,
          text: cipherhex,
          iv_title: iv__title_hex,
          iv_text: iv__text_hex,
        }
        notes.push(noteObj);
        localStorage.setItem('notes', JSON.stringify(notes));
        showNotes();
        addTitle.value = '';
        addText.value = '';
      });
    });

  }

  function showNotes() {

    function decryptMessage(key, iv_title, iv_text, ciphertitle, ciphertext) {
      // The iv value is the same as that used for encryption
      // console.log(iv_title, iv_text, ciphertitle, ciphertext);
      var iv_title = new Uint8Array(iv_title.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      var iv_text = new Uint8Array(iv_text.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      var ciphertitle = new Uint8Array(ciphertitle.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      var ciphertext = new Uint8Array(ciphertext.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      // console.log(iv_title, iv_text, ciphertitle, ciphertext);

      var plain_title = window.crypto.subtle.decrypt({ name: "AES-GCM", iv : iv_title }, key, ciphertitle) ;
      var plain_text = window.crypto.subtle.decrypt({ name: "AES-GCM", iv : iv_text }, key, ciphertext);

      return {
        plain_title : plain_title,
        plain_text: plain_text
      };
    }

    let notesHTML = '';
    let notes = localStorage.getItem('notes');
    if (notes === null) {
      return;
    } else {
      notes = JSON.parse(notes);
    }
    for (let i = 0; i < notes.length; i++) {
      if (notes[i] !== null && notes[i] !== undefined) {

        var iv_title = notes[i].iv_title;
        var iv_text = notes[i].iv_text;
        var ciphertitle = notes[i].title;
        var ciphertext = notes[i].text;

        var plain = decryptMessage(sym_key, iv_title, iv_text, ciphertitle, ciphertext);

        Promise.all([plain.plain_title, plain.plain_text]).then(([plain_title, plain_text]) => {
            var plain_title_decoded = new TextDecoder().decode(plain_title);
            var plain_text_decoded = new TextDecoder().decode(plain_text);
            console.log(plain_title_decoded);
            console.log(plain_text_decoded);
            notesHTML += `<div class="note">
                      <span class="title">${plain_title_decoded === "" ? 'Note' : plain_title_decoded}</span>
                      <div class="text">${plain_text_decoded}</div>
                      <button class="editNote btn btn-primary" id="${i}">Edit</button>
                      <button class="deleteNote btn btn-danger" id=${i}>Delete</button>     
                  </div>
        `
        // console.log(notesHTML);
        // Insert HTML for all notes into the notes div
        notesDiv.innerHTML = notesHTML;

        // Add event listeners for edit, delete, and archive buttons
        const editButtons = document.querySelectorAll('.editNote');
        const deleteButtons = document.querySelectorAll('.deleteNote');

        editButtons.forEach((button) => {
          button.addEventListener('click', () => {
            const noteIndex = button.id;
            editNote(noteIndex);
          });
        });

        deleteButtons.forEach((button) => {
          button.addEventListener('click', () => {
            const noteIndex = button.id;
            deleteNote(noteIndex);
          });
        });

          });
      }
    }
    notesDiv.innerHTML = notesHTML;

  }

  function deleteNote(ind) {
    let notes = localStorage.getItem('notes');
    if (notes === null) {
      return;
    } else {
      notes = JSON.parse(notes);
    }
    // Create a new deleted note object with a timestamp and add it to the list of deleted notes
    const deletedNote = {
      ...notes[ind],
      deleted: new Date().toISOString()
    };
    let deletedNotes = localStorage.getItem('deletedNotes');
    if (deletedNotes === null) {
      deletedNotes = [];
    } else {
      deletedNotes = JSON.parse(deletedNotes);
    }
    deletedNotes.push(deletedNote);
    localStorage.setItem('deletedNotes', JSON.stringify(deletedNotes));
    // Remove the note from the list of existing notes and update local storage
    notes.splice(ind, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    // Update the UI to reflect the changes
    showNotes();
    showDeletedNotes();
  }

  function editNote(ind) {

    // Retrieve all notes from localStorage
    let notes = localStorage.getItem("notes");

    // If there are no notes, return
    if (notes === null) {
      return;
    }
    // Otherwise, parse the notes as JSON and proceed to edit the note at the given index
    else {
      notes = JSON.parse(notes);
    }

    // Retrieve the note at the given index
    const note = notes[ind];

    // If the note has no title or text, return
    if (note.title === "" || note.text === "") {
      return;
    }

    //decrypting old note
    function decryptMessage(key, iv_title, iv_text, ciphertitle, ciphertext) {
      // The iv value is the same as that used for encryption
      // console.log(iv_title, iv_text, ciphertitle, ciphertext);
      var iv_title = new Uint8Array(iv_title.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      var iv_text = new Uint8Array(iv_text.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      var ciphertitle = new Uint8Array(ciphertitle.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      var ciphertext = new Uint8Array(ciphertext.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      // console.log(iv_title, iv_text, ciphertitle, ciphertext);

      var plain_title = window.crypto.subtle.decrypt({ name: "AES-GCM", iv : iv_title }, key, ciphertitle) ;
      var plain_text = window.crypto.subtle.decrypt({ name: "AES-GCM", iv : iv_text }, key, ciphertext);

      return {
        plain_title : plain_title,
        plain_text: plain_text
      };
    }

    var plain = decryptMessage(sym_key, note.iv_title, note.iv_text, note.title, note.text);

    plain.plain_title.then((plain_title) => {
      plain.plain_text.then((plain_text) => {
        var plain_title_decoded = new TextDecoder().decode(plain_title);
        var plain_text_decoded = new TextDecoder().decode(plain_text);
        // console.log(plain_title_decoded);
        // console.log(plain_text_decoded);
        // Prompt the user to edit the title of the note
        const editedtitleNote = prompt("Edit your title of the note", plain_title_decoded);

        // If the user cancels, return
        if (editedtitleNote === null) {
         return;
        }
        // Prompt the user to edit the description of the note
        const editeddescNote = prompt("Edit your description of the note", plain_text_decoded);

        // If the user cancels, return
        if (editeddescNote === null) {
          return;
        }

        const new_encoded_title = new TextEncoder().encode(editedtitleNote);
        const new_encoded_text = new TextEncoder().encode(editeddescNote);

    
        function encryptMessage(key, iv_title, iv_text, encoded_title, encoded_text) {

          var iv_title = new Uint8Array(iv_title.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
          var iv_text = new Uint8Array(iv_text.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
          // iv will be needed for decryption
          return {
            ciphertitle: window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv_title }, key, encoded_title),
            ciphertext: window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv_text }, key, encoded_text),
          };
        }
    
        let cipher = encryptMessage(sym_key, note.iv_title, note.iv_text, new_encoded_title, new_encoded_text);

        cipher.ciphertitle.then((ciphertitle) => {
          const ciphertitle_array = Array.from(new Uint8Array(ciphertitle)); // convert buffer to byte array
          const ciphertitle_hex = ciphertitle_array
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""); // convert bytes to hex string
          // console.log(ciphertitle_hex);
    
          cipher.ciphertext.then((ciphertext) => {
            const cipherarray = Array.from(new Uint8Array(ciphertext)); // convert buffer to byte array
            const cipherhex = cipherarray
              .map((b) => b.toString(16).padStart(2, "0"))
              .join(""); // convert bytes to hex string
            // console.log(cipherhex);
    
            // Update the note with the edited title and description

            note.title = ciphertitle_hex;
            note.text = cipherhex;

            // Update localStorage with the edited note
            localStorage.setItem("notes", JSON.stringify(notes));

            // Show the updated notes on the page
            showNotes();
          });
        });
        // enc end
      });
    });

  }

  function showDeletedNotes() {
    const deletedNotes = JSON.parse(localStorage.getItem('deletedNotes')) || [];
    const deletedNotesHTML = deletedNotes.map(note => {
      const noteDiv = document.createElement('div');
      noteDiv.className = 'note deleted';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = note.title || 'Note';
      noteDiv.appendChild(titleSpan);

      const textDiv = document.createElement('div');
      textDiv.className = 'text';
      textDiv.textContent = note.text;
      noteDiv.appendChild(textDiv);

      const deletedDateDiv = document.createElement('div');
      deletedDateDiv.className = 'deletedDate';
      deletedDateDiv.textContent = new Date(note.deleted).toLocaleString();
      noteDiv.appendChild(deletedDateDiv);

      const restoreButton = document.createElement('button');
      restoreButton.className = 'restoreButton btn btn-success';
      restoreButton.textContent = 'Restore';
      restoreButton.addEventListener('click', () => {
        restoreNote(note.id);
      });
      noteDiv.appendChild(restoreButton);

      return noteDiv;
    });

    deletedNotesDiv.innerHTML = '';
    deletedNotesHTML.forEach(note => {
      deletedNotesDiv.appendChild(note);
    });
  }


  const deleteButtons = document.querySelectorAll('.delete');
  deleteButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      const noteIndex = event.target.dataset.index;
      deleteNote(noteIndex);
    });
  });

  function restoreNote() {
    let deletedNotes = localStorage.getItem('deletedNotes');
    if (deletedNotes === null) {
      return;
    } else {
      deletedNotes = JSON.parse(deletedNotes);
    }
  
    // Remove the last deleted note from the deletedNotes array
    const noteToRestore = deletedNotes.pop();
  
    // Add the restored note to the notes array
    let notes = localStorage.getItem('notes');
    if (notes === null) {
      notes = [];
    } else {
      notes = JSON.parse(notes);
    }
    notes.push(noteToRestore);
    localStorage.setItem('notes', JSON.stringify(notes));
  
    // Save the updated deletedNotes array to local storage
    localStorage.setItem('deletedNotes', JSON.stringify(deletedNotes));
  
    // Refresh the notes on the page
    showNotes();
    showDeletedNotes();
  }
  

  // Attach event listener to the add note button
  addNoteButton.addEventListener('click', addNotes);
  showNotes();
  showDeletedNotes();
});

