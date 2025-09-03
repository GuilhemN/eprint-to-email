import { render } from '@react-email/render'
import Email from './email/Email'
import { filterItemsFromFeed } from './filterItems'
import { parseFeeds, SettledFeed } from './parseFeeds'
import { getItemCount } from './getItemCount'
import { getDatabase } from './database'
import dayjs from 'dayjs'

interface Props {
  cache: { feeds: SettledFeed[]; feedUrls: string[] }
  pretty: boolean
}

export async function renderEmail({ cache, pretty = false }: Partial<Props>) {
  const db = getDatabase()

  // Check if this is the first run by looking at database stats
  const stats = await db.getStats()
  const initialRun = stats.totalRuns === 0

  const { feeds, feedUrls } = cache ?? (await parseFeeds())

  const filteredFeeds = await filterItemsFromFeed(feeds, feedUrls, undefined)
  const updatedOn = dayjs().toISOString() // Use current time as the update timestamp

  const itemCount = getItemCount(filteredFeeds)

  // Mark new items as seen in the database
  const newItems: Array<{ id: string; feedUrl: string; title: string; link: string; pubDate: string }> = []

  filteredFeeds.forEach((feed, index) => {
    if (feed.status === 'fulfilled') {
      const feedUrl = feedUrls[index] || ''
      feed.value.items.forEach((item) => {
        const itemId = item.id || item.guid || ''
        if (itemId) {
          newItems.push({
            id: itemId,
            feedUrl,
            title: item.title || '',
            link: item.link || '',
            pubDate: item.pubDate || dayjs().toISOString(),
          })
        }
      })
    }
  })

  if (newItems.length > 0) {
    await db.markItemsAsSeen(newItems)
  }

  const html = render(<Email feeds={filteredFeeds} initialRun={initialRun} itemCount={itemCount} />, {
    pretty,
  })

  return { html, itemCount, updatedOn, feeds: filteredFeeds }
}
