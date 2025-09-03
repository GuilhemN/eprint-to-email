import { Item } from 'rss-parser'
import { CustomItem, SettledFeed } from './parseFeeds'
import { getDatabase } from './database'
import dayjs from 'dayjs'

const filterItems = async (items: (Item & CustomItem)[], feedUrl: string, limit?: number) => {
  const db = getDatabase()
  const cutoffDate = dayjs().subtract(60, 'days')

  const filteredItems = []

  for (const item of items) {
    const { guid, id, pubDate } = item

    // Filter out items older than 60 days to keep emails relevant
    if (pubDate && dayjs(pubDate).isBefore(cutoffDate)) {
      continue
    }

    // Check if we've seen this item before using both guid and id as fallbacks
    const itemId = id || guid || ''
    if (itemId && (await db.hasSeenItem(itemId, feedUrl))) {
      continue
    }

    filteredItems.push(item)

    // Stop if we've reached the limit
    if (limit && filteredItems.length >= limit) {
      break
    }
  }

  return filteredItems
}

export const filterItemsFromFeed = async (feeds: SettledFeed[], feedUrls: string[], limit?: number) => {
  // Filter feed items that are already seen or surpass the provided `limit`
  const filteredFeeds = []

  if (!feeds || !Array.isArray(feeds)) {
    return []
  }

  if (!feedUrls || !Array.isArray(feedUrls)) {
    return []
  }

  for (let index = 0; index < feeds.length; index++) {
    const feed = feeds[index]

    switch (feed.status) {
      case 'fulfilled':
        const feedUrl = feedUrls[index] || ''
        const items = feed.value.items || []
        const filteredItems = await filterItems(items, feedUrl, limit)
        filteredFeeds.push({
          ...feed,
          value: {
            ...feed.value,
            items: filteredItems,
          },
        })
        break
      case 'rejected':
        filteredFeeds.push(feed)
        break
    }
  }

  // Filter out feeds with no items
  const feedsWithItems = filteredFeeds.filter((feed) => (feed.status === 'fulfilled' ? feed.value.items.length > 0 : true))

  // If there are no updates or one or more feeds are fulfilled, continue with those feeds
  if (feedsWithItems.length === 0 || feedsWithItems.some(({ status }) => status === 'fulfilled')) {
    return feedsWithItems
  }

  // At this point we have no updated items and all remaining feeds have been rejected
  feedsWithItems.forEach((feed) => {
    if (feed.status === 'rejected') {
      console.error(`Feed ${feed.feed} failed, reason: ${feed.reason}`)
    }
  })

  throw new Error('One or more feeds failed while no new items!')
}
