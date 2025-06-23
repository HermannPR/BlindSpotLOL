# League of Legends Developer API Documentation

## Table of Contents
- [Developer API Policy](#developer-api-policy)
- [Registration](#registration)
- [Monetization](#monetization)
- [Security](#security)
- [Game Integrity](#game-integrity)
- [Tournament Policies](#tournament-policies)
- [Summoner Names to Riot IDs](#summoner-names-to-riot-ids)
- [Data Dragon](#data-dragon)
- [Tournament API](#tournament-api)
- [League Client API](#league-client-api)
- [Game Client API](#game-client-api)
- [Live Client Data API](#live-client-data-api)
- [Replay API](#replay-api)
- [Working with LoL APIs](#working-with-lol-apis)
- [Getting Help](#getting-help-and-staying-up-to-date)

## Developer API Policy

Before you begin, read through the General and Game Policies, Terms of Use and Legal Notices. Developers must adhere to policy changes as they arise.

### General Requirements

When developing using the API, you must abide by the following:

- Products cannot violate any laws
- Do not create or develop games utilizing Riot's Intellectual Property (IP)
- No cryptocurrencies or blockchain
- No apps serving as a "data broker" between our API and another third-party company
- Products cannot closely resemble Riot's games or products in style or function

### Allowed IP Assets

Only the following Riot IP assets may be used in the development and marketing of your product:

- **Press kit** - Using Riot logos and trademarks from the Press Kit must be limited to cases where such use is unavoidable in order to serve the core value of the product
- **Game-Specific static data**

### Legal Requirements

You must post the following legal boilerplate to your product in a location that is readily visible to players:

> [Your Product Name] is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc

## Registration

If your product serves players, you must register it with us regardless of whether or not your product uses official documented APIs. You must make sure its description and metadata are kept up to date with the current version of your product.

## Monetization

To monetize your product, you must abide by the following:

- Your product cannot feature betting or gambling functionality
- Your product must be registered on the Developer Portal and your product status is either **Approved** or **Acknowledged**
- You must have a free tier of access for players, which may include advertising
- Your content must be transformative if you are charging players for it

### What is transformative?

Was value added to the original by creating new information, new aesthetics, new insights, and understandings? If so, then it was transformative.

### Acceptable monetization methods:

- Subscriptions, donations, or crowdfunding
- Entry fees for tournaments
- Currencies that cannot be exchanged back into fiat

Your monetization cannot gouge players or be unfair, as decided by Riot. If you are unsure if your monetization platform is acceptable, contact us through the Developer Portal.

## Security

You must adhere to the following security policies:

- Do not share your Riot Games account information with anyone
- Do not use a Production API key to run multiple projects. You may only have one product per key
- Use SSL/HTTPS when accessing the APIs so your API key is kept safe
- Your API key may not be included in your code, especially if you plan on distributing a binary
- This key should only be shared with your teammates. If you need to share an API key for your product with teammates, make sure your product is owned by a group in the Developer portal

## Game Integrity

- Products must not use or incorporate information not present in the game client that would give players a competitive edge (e.g., automatically or manually allowing tracking enemy ultimate cooldowns), especially when such data is not already accessible through regular gameplay
- Products cannot alter the goal of the game (i.e. Destroy the Nexus)
- Products cannot create an unfair advantage for players, like a cheating program or giving some players an advantage that others would not otherwise have
- Products should increase, and not decrease the diversity of game decisions (builds, compositions, characters, decks)
- Products should not remove game decisions, but may highlight decisions that are important and give multiple choices to help players make good decisions
- Products cannot create alternatives for official skill ranking systems such as the ranked ladder. Prohibited alternatives include MMR or ELO calculators
- Products cannot identify or analyze players who are deliberately hidden by the game

## Tournament Policies

Tournaments must:

- Follow all monetization policies above
- Allot at least 70% of the entry fees to the prize pool
- Win conditions must be fair and transparent to players (we determine fair)
- Must have at least 20 participants
- Not include any gambling

If you are a tournament organizer operating in the **US or Canada**, please refer to, and adhere to, the North American tournament organizer policies.

If you are a tournament organizer operating in **Europe**, please refer to, and adhere to, the European tournament organizer policies.

## Summoner Names to Riot IDs

On November 20, 2023, we are transitioning our systems away from Summoner Names to using Riot ID as an authoritative way to reference players in League and TFT.

### Key Changes

All player-facing front-end fields and forms will require modification. Applications featuring the "Find your Summoner by Region + Name" functionality must adapt to locate summoners using **Riot IDs**, which are formed by combining the "game name" and "tag line".

For all other Riot API endpoints, filtering by player can be accomplished using either the **PUUID** or **summonerID**. Some APIs offer both options, but we recommend employing **PUUID endpoints** when available.

### Deprecated Endpoints

We recommend no longer using these endpoints:

- `https://developer.riotgames.com/apis#summoner-v4/GET_getBySummonerName` - `/lol/summoner/v4/summoners/by-name/{summonerName}`
- `https://developer.riotgames.com/apis#tft-summoner-v1/GET_getBySummonerName` - `/tft/summoner/v1/summoners/by-name/{summonerName}`

Although deprecated, they can still be used to convert Summoner Names to PUUID or summonerID. However, we discourage using them as part of your application since they will be removed in the future.

### Obtaining PUUID and summonerID from RiotID

1. **ACCOUNT-V1** - Use `/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` to obtain the PUUID associated with a given account by Riot ID
2. **SUMMONER-V4** - Use `/lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}` to retrieve summoner data by PUUID, including summonerID

### Obtaining Riot ID from PUUID

**ACCOUNT-V1** - Use `/riot/account/v1/accounts/by-puuid/{puuid}` to fetch account information (gameName + tagLine) by PUUID.

### Obtaining Riot ID from summonerID

**SUMMONER-V4** - Use `/lol/summoner/v4/summoners/{encryptedSummonerId}` to retrieve summoner data by summonerID, which can be used to obtain the corresponding PUUID.

## Data Dragon

Data Dragon is our way of centralizing League of Legends game data and assets, including champions, items, runes, summoner spells, and profile icons. All of which can be used by third-party developers.

### Latest Version

```
https://ddragon.leagueoflegends.com/cdn/dragontail-15.12.1.tgz
```

### Versions

You can find all valid Data Dragon versions in:
```
https://ddragon.leagueoflegends.com/api/versions.json
```

### Regions

Data Dragon versions are not always equivalent to the League of Legends client version in a region. You can find the version each region is using in the realms files:
```
https://ddragon.leagueoflegends.com/realms/na.json
```

### Languages

Data Dragon provides localized versions in multiple languages. Retrieve the supported languages from:
```
https://ddragon.leagueoflegends.com/cdn/languages.json
```

### Champions Data

- **Champion list**: `https://ddragon.leagueoflegends.com/cdn/15.12.1/data/en_US/champion.json`
- **Individual champion**: `https://ddragon.leagueoflegends.com/cdn/15.12.1/data/en_US/champion/Aatrox.json`

### Champion Assets

- **Splash art**: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg`
- **Loading screen**: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Aatrox_0.jpg`
- **Square portraits**: `https://ddragon.leagueoflegends.com/cdn/15.12.1/img/champion/Aatrox.png`
- **Passive abilities**: `https://ddragon.leagueoflegends.com/cdn/15.12.1/img/passive/Anivia_P.png`
- **Champion abilities**: `https://ddragon.leagueoflegends.com/cdn/15.12.1/img/spell/FlashFrost.png`

### Items

```
https://ddragon.leagueoflegends.com/cdn/15.12.1/data/en_US/item.json
```

### Other Assets

- **Summoner Spells**: `https://ddragon.leagueoflegends.com/cdn/15.12.1/data/en_US/summoner.json`
- **Profile Icons**: `https://ddragon.leagueoflegends.com/cdn/15.12.1/data/en_US/profileicon.json`

## Tournament API

League of Legends leverages custom game lobbies to support developers that want to build Tournaments for players.

### Features

The Tournaments API allows you to:

- Register tournament providers and tournaments in a specific region/shard and its callback URL
- Generate tournament codes for a given tournament
- Receive game results in the form of an automatic callback (HTTP POST) from League of Legends servers
- Use match identifier (matchID) received in the callback to pull full stats data for the given match
- Pull end of game data based on given tournament code in case the callback is never received
- Query pre-game lobby player activity events for a given tournament code

### Best Practices

- Respect the rate limit for your Tournament API Key
- Implement logic to detect unsuccessful API calls and back off accordingly
- Generate tournaments and tournament codes only as needed
- Create tournaments and codes within a reasonable time in relation to the event

## Live Client Data API

The Live Client Data API provides a method for gathering data during an active game.

### Base URL
```
https://127.0.0.1:2999/liveclientdata/
```

### Key Endpoints

- **All game data**: `GET /allgamedata`
- **Active player**: `GET /activeplayer`
- **Player list**: `GET /playerlist`
- **Game stats**: `GET /gamestats`
- **Events**: `GET /eventdata`

## Replay API

The Replay API allows developers to adjust the in-game camera during replays.

### Setup

Enable the Replay API by adding to `game.cfg`:
```
[General]
EnableReplayApi=1
```

### Base URL
```
https://127.0.0.1:2999/replay/
```

## Working with LoL APIs

### Routing Values

#### Platform Routing Values

| Platform | Host |
|----------|------|
| BR1 | br1.api.riotgames.com |
| EUN1 | eun1.api.riotgames.com |
| EUW1 | euw1.api.riotgames.com |
| JP1 | jp1.api.riotgames.com |
| KR | kr.api.riotgames.com |
| LA1 | la1.api.riotgames.com |
| LA2 | la2.api.riotgames.com |
| NA1 | na1.api.riotgames.com |
| OC1 | oc1.api.riotgames.com |
| TR1 | tr1.api.riotgames.com |

#### Regional Routing Values

| Region | Host |
|--------|------|
| AMERICAS | americas.api.riotgames.com |
| ASIA | asia.api.riotgames.com |
| EUROPE | europe.api.riotgames.com |
| SEA | sea.api.riotgames.com |

### Game Constants

- **Seasons**: [seasons.json](https://static.developer.riotgames.com/docs/lol/seasons.json)
- **Queue IDs**: [queues.json](https://static.developer.riotgames.com/docs/lol/queues.json)
- **Maps**: [maps.json](https://static.developer.riotgames.com/docs/lol/maps.json)
- **Game Modes**: [gameModes.json](https://static.developer.riotgames.com/docs/lol/gameModes.json)
- **Game Types**: [gameTypes.json](https://static.developer.riotgames.com/docs/lol/gameTypes.json)

## Getting Help and Staying Up-to-date

- **Support**: Join [Developer Discord](https://discord.gg/riotgamesdevrel)
- **Updates**: Follow [@RiotGamesAPI on Twitter](https://twitter.com/RiotGamesAPI)

---

*This documentation is based on the official Riot Games API documentation and is provided for reference purposes.*
