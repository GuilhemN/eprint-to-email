import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { createServer as createViteServer } from 'vite'

const outputDir = './dist'

const getFromArgv = (key) => process.argv.find((arg) => arg.startsWith(`${key}=`))?.replaceAll(`${key}=`, '')

async function createEmail() {
  const vite = await createViteServer({
    appType: 'custom',
  })

  const actionUrl = getFromArgv('actionUrl')

  try {
    const { renderEmail } = await vite.ssrLoadModule('/src/renderEmail.tsx')

    var fileContents, lastSuccess;
    try {
      lastSuccess = readFileSync('dist/lastupdate', { encoding: 'utf8', flag: 'r' });
    } catch (err) {
      // Here you get the error when the file was not found,
      // but you also get any other error
      lastSuccess = null;
    }

    const { html, itemCount, updatedOn } = await renderEmail({ actionUrl, lastSuccess })

    if (itemCount === 0) {
      console.log('No new items in feed, skipping email')
      process.exit(0)
    }

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir)
    }

    writeFileSync(`${outputDir}/lastupdate`, updatedOn, { flag: 'w' })
    writeFileSync(`${outputDir}/email.html`, html, { flag: 'w' })

    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

createEmail()
