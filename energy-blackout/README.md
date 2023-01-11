# energy-blackout

### Start local server on 8000 port:
```shell
python3 -m http.server 8000
```
So the local server can be accessed with the link:
http://localhost:8000/


### Add new month:
- copy month folder and rename it (e.g. `month/december2022` -> `month/january2023`)
- update `index.html`, `app.js`, `blackouts.js`, `blackouts-low-temperature.js` of the newly create month folder with data of the new month
- update `index.html` in the root folder to add link to the newly created month folder


### Push changes
```shell
git commit -m "Commit message"
git push
```

### Verify changes on github page
https://reheda.github.io/energy-blackout/