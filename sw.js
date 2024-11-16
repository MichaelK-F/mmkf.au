// Send the request to the network first
// If it's not found, look in the cache
event.respondWith(
  fetch(request).then(function (response) {
    return response;
  }).catch(function (error) {
    return caches.match(request).then(function (response) {
      return response;
    });
  })
);
