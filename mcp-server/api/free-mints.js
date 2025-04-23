// mcp-server/api/free-mints.js
const express = require('express')
const axios = require('axios')

const router = express.Router()

router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10

  try {
    const collectionsRes = await axios.get('https://api-mainnet.magiceden.dev/v2/collections')
    const collections = collectionsRes.data.slice(0, 20)
    const freeMints = []

    for (const col of collections) {
      const { symbol } = col
      try {
        const listingsRes = await axios.get(`https://api-mainnet.magiceden.dev/v2/collections/${symbol}/listings?limit=20`)
        const free = listingsRes.data.filter(item => item.price === 0)

        free.forEach(nft => {
          if (freeMints.length < limit) {
            freeMints.push({
              name: nft.title || nft.tokenMint,
              image: nft.img || 'https://placehold.co/150x150?text=No+Image',
              link: `https://magiceden.io/item-details/${nft.tokenMint}`
            })
          }
        })

        if (freeMints.length >= limit) break
      } catch {
        continue
      }
    }

    res.json({ success: true, data: freeMints })
  } catch (err) {
    console.warn('⚠️ Failed to fetch free mints:', err.message)
    res.status(500).json({ success: false, error: 'Fetch failed.' })
  }
})

module.exports = router
