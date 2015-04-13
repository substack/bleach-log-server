# bleach-log-server

keep track of bleach levels for a hot tub or a pool

# usage

```
bleach-log-server OPTIONS

  Keep track of bleach levels in a hot tub or a pool.
  This command starts the server.

  -d --datadir  Store log data in this directory. Default: ./bleach-data
  -p --port     Listen for incoming http connections on this port.
  -u --uid      Drop permissions to this uid.
  -g --gid      Drop permissions to this gid.

  To log 2 cups of bleach, send a POST to /save

    $ curl -X POST -d cups=2 http://localhost:5000/save
    ok

```

# install

With [npm](https://npmjs.org) do:

```
npm install -g bleach-log-server
```

# license

MIT
