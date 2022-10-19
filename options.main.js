addEventListener('DOMContentLoaded', () => {

document.querySelector('title').textContent += ' - ' + document.querySelector(OpenUrlsOptions.tagName).meta?.name;

}, { once: true });