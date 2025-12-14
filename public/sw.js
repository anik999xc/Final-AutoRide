self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return new Response(`
        <html>
          <head><title>Offline</title></head>
          <body style="text-align:center; padding-top:50px;">
            <h1>You are currently Offline.</h1>
            <p>Please turn on your Internet or Wi-Fi and try again.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    })
  );
});
