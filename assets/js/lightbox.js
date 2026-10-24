// Lightbox for the gallery and any link with class "zoom": click a photo to enlarge it; click anywhere (or press Esc) to go back.
// Without JavaScript the links still open the full-size image.
(function () {
  var links = document.querySelectorAll('.gallery a, a.zoom');
  if (!links.length || typeof HTMLDialogElement !== 'function') return;

  var dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Enlarged photo');
  var img = document.createElement('img');
  var cap = document.createElement('p');
  dialog.appendChild(img);
  dialog.appendChild(cap);
  document.body.appendChild(dialog);

  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let "open in new tab" work
      e.preventDefault();
      var thumb = a.querySelector('img');
      img.src = a.href;
      img.alt = thumb ? thumb.alt : '';
      var fc = a.parentElement.querySelector('figcaption');
      cap.textContent = fc ? fc.textContent : '';
      cap.hidden = !fc;
      dialog.showModal();
    });
  });

  dialog.addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('close', function () { img.removeAttribute('src'); });
})();
