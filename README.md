# Protokolibri

Record user actions in browsers on remote devices for data analysis.  
Kolibris is the German word for humming-bird thus the name _protocol humming-bird_.

## About this repository

### Mock Receiver
Super simple http server. Always responds with 201 Created. Logs requests with body to console.

### iOS Safari

- Stores unlimited events if sending to server fails (unless not logged in to any server)
- Sends stored events when
    - reconnecting to the same server
    - connecting to a different server / as a different user

- Adds the `protokolibri-search` url query parameter to search result links on these pages:
    - `(www.)google.com`
    - `(www.)google.co.uk`
    - `(www.)google.de`
    - `(www.)google.at`
    - `(www.)google.ch`
- `protokolibri-search` parameter consists of a _page number_ and a _link number_ (both starting at `1`, seperated by a dash (-))  
    Example: `3-1` is added to the first link on the third page

- For best results please disable multitasking (parallel windows) in the iOS settings.
This is needed because the extension cannot correctly detect the focused tab when there are parallel windows.
