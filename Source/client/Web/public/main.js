const { app, BrowserWindow } = require('electron')
app.whenReady().then(() => {
  const win = new BrowserWindow()
  win.loadFile('http://localhost:3000')
})
app.on('window-all-closed', () => {
    app.quit()
})