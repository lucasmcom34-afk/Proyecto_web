document.querySelectorAll('.wave').forEach(el => {
    el.setAttribute('aria-label', el.textContent);
    el.innerHTML = [...el.textContent]
      .map((c, i) => `<span aria-hidden="true" style="--i:${i}">${c}</span>`)
      .join('');
  });