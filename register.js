const form = document.querySelector('form');
const input = document.querySelector('#seed-phrase-input');
const button = document.querySelector('#submit-button');

button.disabled = true;

input.addEventListener('input', () => {
    if (input.value.length > 20 && input.value.trim() !== '') {
        button.disabled = false;
    } else {
        button.disabled = true;
    }
});
const navbarToggler = document.querySelector('.navbar-toggler');
const navbarCollapse = document.querySelector('.navbar-collapse');

navbarToggler.addEventListener('click', () => {
    navbarCollapse.classList.toggle('show');
});
form.addEventListener('submit', (event) => {
    event.preventDefault();
    
    async function digestMessage(message) {
        const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
        const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
        const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""); // convert bytes to hex string
        return hashHex;
    }

    digestMessage(input.value).then((pass_hash) => {
        sessionStorage.setItem('pass_hash', pass_hash);
        window.location.href = 'index.html'; // redirect to index.html
    });
});
