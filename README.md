# Protokolibri

Record user actions in browsers on remote devices for data analysis.

The German word Protokol can either refer to a protocol
or in this case to logs (as logs created by logging).
Kolibris is the German word for humming-bird thus the name _Protokolibri_ = _logging humming-bird_.

![Protokolibri Logo](server/public/img/icon.png)

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

- `HOSTNAME`= (optional) Hostname the server should listen on. Can be set to `localhost` to only listen to requests from the same machine
- `PORT`= (optional) Port, defaults to `8080`
- `PUBLIC_HOST`= (optional) Use to set the public host when behind a reverse proxy
- `ADMIN_DEFAULT_PASSWORD`= Initial password used for creating the user 'admin'
- `MARIADB_HOST`= Host of mariadb, for example `mydb.com`
- `MARIADB_PORT`= (optional) Port of mariadb, defaults to `3306`
- `MARIADB_USER`= Username for mariadb
- `MARIADB_PASSWORD`= Password for mariadb
- `MARIADB_DATABASE`= Name of the database protokolibri should use
- `MARIADB_SSL`= (optional) Set to `1` to encrypt communication with database
- `MARIADB_SSL_TRUST_SERVER_UNSAFE`= (optional) Set to `1` to skip verifying the SSL certificate of the server.
  Useful for self signed certificates, but considered unsafe.

Configure protokolibri to start when booting

```sh
systemctl --user enable protokolibri
```

Manually start protokolibri (instead of rebooting the server)

```sh
systemctl --user start protokolibri
```

Access the web interface at `https://<PUBLIC_HOST>/dashboard`.

### Development

Start the development server using `docker compose up`.  
To specifiy the servers timezone, edit _compose.yml_ (default is `Europe/Berlin`).
Also edit _compose.yml_ to set the correct public host, so the pairing qr codes point to your local machine.

## iOS Safari Extension

### Installation

Safari Extensions always come as part of an iOS app (which in this case does nothing except exporting the extension).  
As I am currently not part of the Apple Developer Programm you have to compile and install the app yourself.
Please refer to Apple's documentation on how to do this.
The XCode project's root is the _ios-safari/_ directory.

For best results please disable multitasking (parallel windows) in the iOS settings.
This is needed because the extension cannot correctly detect the focused tab when there are parallel windows.

### Features

#### Connecting

To connect the extension with the server follow the instructions on the servers web interface (Dashboard).

#### Events

When connected the extension records events and sends them to the server. Every event contains the **timestamp** at which the event happened, the **ID of the tab** the event happened in and of of these types:

- `created` When a tab is created
- `activated` When the user switches to a tab
- `removed` When a tab is closed
- `updated` When the loaded page in a tab changes

The event types `created` and `updated` additionally contain the tabs **title** and **url**.

#### Serach result indexing

When the website was opened by clicking a link on one of these websites:

```
(www.)google.com
(www.)google.co.uk
(www.)google.de
(www.)google.at
(www.)google.ch
```

the _updated-event_ also contains a search result index in the form of a _page number_ and a _link number_ (both starting at 1, seperated by a dash (-)).  
Example: `3-1` is means the opened url was the first link on the third page.

#### Local storage

If sending the event to the server fails,
the events are stored on the device and are transmitted to the server
as soon as the connection is reestablished.
As they are stored with their timestamp the resulting data is unchanged.

## Mock Receiver

Super simple http server. Always responds with 201 Created. Logs requests with body to console. Use for developing and testing the browser extension client without booting the whole backend.

## Security

Connections of clients (webapp and browser extension) and the backend are enforced to be over https.

There are three different authentication methods used for accessing different functionality of the backend.

### User Authentication

When using the servers web app (the dashboard) users authenticate using
Basic HTTP Authentication as defined by [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617.txt).
Passwords are hashed using bcrypt and stored in the database.

### Device Authentication

The browser extension also uses Basic HTTP Authentication like the user authentication but on a different realm (meaning user login data would not be valid).
On the local device the password is stored as plaintext in the extensions local storage.

### Connection Code Authentication

When pairing new devices / connecting the browser extension to the server
a user generates a qr code containing a link with a connection code.
The connection code is valid for 30 minutes.
It can be used to generate and retrieve new passwords for device authentication.  
Connection codes are stored as plaintext in the database, as they have a short lifetime.
