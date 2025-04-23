# Protokolibri

Record user actions in browsers on remote devices for data analysis.  
Kolibris is the German word for humming-bird thus the name _protocol humming-bird_.

## Server

### Installation

Follow these steps to install the server software on a linux server.
The server requires an external mariadb database.

_Please note: Installing does not require root.
Please do not run as root.
Use an unpriviledged user (with a home directory)._

Download and install the server using the install script:

```sh
curl -o- https://raw.githubusercontent.com/hexzeug/protokolibri/refs/heads/main/server/install.sh | bash
```

Configure the following environment variables in the file `protokolibri.env` in your home directory:

- `HOSTNAME`: (optional) Hostname the server should listen on. Can be set to `localhost` to only listen to requests from the same machine
- `PORT`: (optional) Port, defaults to `8080`
- `PUBLIC_HOST`: (optional) Use to set the public host when behind a reverse proxy
- `ADMIN_DEFAULT_PASSWORD`: Initial password used for creating the user 'admin'
- `MARIADB_HOST`: Host of mariadb, for example `mydb.com`
- `MARIADB_USER`: Username for mariadb
- `MARIADB_PASSWORD`: Password for mariadb
- `MARIADB_DATABASE`: Name of the database protokolibri should use

Configure protokolibri to start when booting

```sh
systemctl --user enable protokolibri
```

Manually start protokolibri (instead of rebooting the server)

```sh
systemctl --user start protokolibri
```

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

### Server

#### Development

Start the development server using `docker compose up`.  
To specifiy the servers timezone, edit _compose.yml_ (default is `Europe/Berlin`).

...
