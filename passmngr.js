// Remove any previous data stored in local storage
localStorage.removeItem('deletedpass');

// Get references to HTML elements we need to manipulate
const addPasswordButton = document.getElementById('addPassword');
const addWebsite = document.getElementById('addWebsite');
const addUsername = document.getElementById('addUsername');
const addPassword = document.getElementById('addPassword');
const passwordsDiv = document.getElementById('passwords');
const addNoteButton = document.getElementById('addNote');
const notesDiv = document.getElementById('notes');


let pass_hash = sessionStorage.getItem('pass_hash');
var pass_arraybuffer = new Uint8Array(pass_hash.match(/[\da-f]{2}/gi).map(function (h) {
  return parseInt(h, 16);
}));

function importSecretKey(rawKey) {
  return window.crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

importSecretKey(pass_arraybuffer).then((sym_key) => {


  function addpassword() {

    let passwords = localStorage.getItem('passwords');
    const iv_website = window.crypto.getRandomValues(new Uint8Array(12));
    const iv_username = window.crypto.getRandomValues(new Uint8Array(12));
    const iv_password = window.crypto.getRandomValues(new Uint8Array(12));

    if (passwords === null) {
      passwords = [];
    } else {
      passwords = JSON.parse(passwords);
    }

    // Ensure that the user has entered some text before creating a password
    if (addWebsite.value == '' || addUsername.value == '' || addPassword.value == '') {
      alert('Please fill in all fields');
      return;
    }

    // Create a new password object and add it to the list of passwords
    function getMessageEncoding(message) {
      const enc = new TextEncoder();
      return enc.encode(message);
    }

    function encryptMessage(key, iv_website, iv_username, iv_password) {
      const encoded_website = getMessageEncoding(addWebsite.value);
      const encoded_username = getMessageEncoding(addUsername.value);
      const encoded_password = getMessageEncoding(addPassword.value);
      // console.log(encoded_website, encoded_username, encoded_password)
      return {
        cipherwebsite: window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv_website }, key, encoded_website),
        cipherusername: window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv_username }, key, encoded_username),
        cipherpassword: window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv_password }, key, encoded_password),
      };
    }

    let cipher = encryptMessage(sym_key, iv_website, iv_username, iv_password);

    cipher.cipherwebsite.then((cipherwebsite) => {
      const cipherwebsite_array = Array.from(new Uint8Array(cipherwebsite));
      const cipherwebsite_hex = cipherwebsite_array
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      cipher.cipherusername.then((cipherusername) => {
        const cipherusername_array = Array.from(new Uint8Array(cipherusername));
        const cipherusername_hex = cipherusername_array
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        cipher.cipherpassword.then((cipherpassword) => {
          const cipherpassword_array = Array.from(new Uint8Array(cipherpassword));
          const cipherpassword_hex = cipherpassword_array
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');

             //Converting ivs to hex

        const iv_website_array = Array.from(new Uint8Array(iv_website)); // convert buffer to byte array
        const iv_website_hex = iv_website_array
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""); // convert bytes to hex string
        const iv_username_array = Array.from(new Uint8Array(iv_username)); // convert buffer to byte array
        const iv_username_hex = iv_username_array
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""); // convert bytes to hex string
          const iv_password_array = Array.from(new Uint8Array(iv_password)); // convert buffer to byte array
          const iv_password_hex = iv_password_array
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""); // convert bytes to hex string
        const passObj = {
          website: cipherwebsite_hex,
          username: cipherusername_hex,
          password: cipherpassword_hex,
          iv_website: iv_website_hex,
          iv_username: iv_username_hex,
          iv_password: iv_password_hex,
        }
        passwords.push(passObj);
        localStorage.setItem('passwords', JSON.stringify(passwords));
        showpass();
        addWebsite.value = '';
        addUsername.value = '';
        addPassword.value = '';

        });
      });
    });

    
  }


  function showpass() {

  
      
    function decryptMessage(key, iv_website, iv_username, iv_password, cipherwebsite, cipherusername, cipherpassword) {
      // The iv value is the same as that used for encryption
      // console.log(iv_title, iv_text, ciphertitle, ciphertext);
      var iv_website = new Uint8Array(iv_website.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      var iv_username = new Uint8Array(iv_username.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      var iv_password = new Uint8Array(iv_password.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      var ciphertitle = new Uint8Array(cipherwebsite.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      var ciphertext = new Uint8Array(cipherusername.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      var cipherpass = new Uint8Array(cipherpassword.match(/[\da-f]{2}/gi).map(function (h) {return parseInt(h, 16)}));
      // console.log(iv_title, iv_text, ciphertitle, ciphertext);

      var plain_website = window.crypto.subtle.decrypt({ name: "AES-GCM", iv : iv_website }, key, ciphertitle) ;
      var plain_username = window.crypto.subtle.decrypt({ name: "AES-GCM", iv : iv_username }, key, ciphertext);
      var plain_pass = window.crypto.subtle.decrypt({ name: "AES-GCM", iv : iv_password }, key, cipherpass);

      return {
        plain_website : plain_website,
        plain_username: plain_username,
        plain_pass : plain_pass,
      };
    }

    let notesHTML = '';
    let notes = localStorage.getItem('passwords');
    if (notes === null) {
      return;
    } else {
      notes = JSON.parse(notes);
    }
    for (let i = 0; i < notes.length; i++) {
      if (notes[i] !== null && notes[i] !== undefined) {

        var iv_website = notes[i].iv_website;
        var iv_username = notes[i].iv_username;
        var iv_password = notes[i].iv_password;
        var website = notes[i].website;
        var username = notes[i].username;
        var password = notes[i].password;

        var plain = decryptMessage(sym_key, iv_website, iv_username,iv_password , website, username, password);

        Promise.all([plain.plain_website, plain.plain_username, plain.plain_pass]).then(([plain_website, plain_username, plain_pass]) => {
            var plain_website_decoded = new TextDecoder().decode(plain_website);
            var plain_username_decoded = new TextDecoder().decode(plain_username);
            var plain_pass_decoded = new TextDecoder().decode(plain_pass);
            // console.log(plain_title_decoded);
            // console.log(plain_text_decoded);
            notesHTML += `<div class="note">
                      <span class="title">${plain_website_decoded === "" ? 'Note' : plain_website_decoded}</span>
                      <div class="text">${plain_username_decoded}</div>
                      <div class="text">${plain_pass_decoded}</div>
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
    let notes = localStorage.getItem('passwords');
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
    let deletedNotes = localStorage.getItem('deletedpass');
    if (deletedNotes === null) {
      deletedNotes = [];
    } else {
      deletedNotes = JSON.parse(deletedNotes);
    }
    deletedNotes.push(deletedNote);
    localStorage.setItem('deletedpass', JSON.stringify(deletedNotes));
    // Remove the note from the list of existing notes and update local storage
    notes.splice(ind, 1);
    localStorage.setItem('passwords', JSON.stringify(notes));
    // Update the UI to reflect the changes
    showpass();
    // showDeletedNotes();
  }

  addNoteButton.addEventListener('click', addpassword);
// Add event listener to the "Generate Password" button
document.getElementById("generatePasswordButton").addEventListener("click", function () {
  const generatedPassword = generatePassword();
  document.getElementById("addPassword").value = generatedPassword;
});
function generatePassword() {
  const length = 12; // Password length
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"; // Characters to use in the password

  let password = "";
  for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
}

showpass();
});