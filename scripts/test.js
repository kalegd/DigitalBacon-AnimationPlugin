let overlay = document.getElementById('overlay');
let input = document.getElementById('height-input');

input.addEventListener('input', function() {
    overlay.style.height = input.value * 100 + 'vh';
});
