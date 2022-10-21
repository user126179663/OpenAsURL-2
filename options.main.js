addEventListener('DOMContentLoaded', async () => {

const options = document.querySelector(OpenUrlsOptions.tagName);

await options.available,

document.querySelector('title').textContent += ' - ' + options.meta?.name;

}, { once: true });