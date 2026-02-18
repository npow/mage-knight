# Mage Knight

A solo conquest game of exploration, combat, and deck building set in the Atlantean lands. Lead a powerful Mage Knight deep into uncharted territory — conquering keeps, raiding dungeons, fighting dragons, and commanding armies — as day turns to night and the land reveals its secrets one hex at a time.

Based on the board game by Vlaada Chvátil, published by WizKids.

## The Game

You are a Mage Knight, one of the most powerful beings in the land. You carry a deck of action cards that let you march across the countryside, smash through enemy defenses, influence local villages, and channel mana into devastating spells. Every card in your hand is a decision: play it for a basic effect, burn mana to power it up, or toss it sideways for a single point of whatever you need most right now.

The map starts as a single tile. Move to the edge and new terrain unfolds — forests, hills, keeps garrisoned by orcs, mage towers crackling with arcane energy, and eventually the cities you've come to conquer. Every hex costs movement, and the costs change when the sun goes down. Night turns forests into near-impassable tangles and flips gold mana to black.

Combat runs in phases. Ranged attacks hit first. Then you block (or don't). Then whatever damage gets through the cracks becomes wounds — dead-weight cards that clog your hand for the rest of the game. Then you swing back. Enemies have armor, abilities like Fortified or Brutal, and the dragons are exactly as nasty as you'd expect.

Between fights you level up, learn skills, gain advanced actions and spells, recruit units at villages, and collect mana crystals from mines. By the end, your lean starting deck has become a sprawling engine of destruction. Or you ran out of time and the cities still stand. It happens.

## Heroes

- **Tovak the Stubborn** — Defensive specialist. Endures where others fall. Starts with Ice Block and Battle Versatility.
- **Norowas the Mystic** — Influence and healing. Gets along with the locals. Starts with Noble Manners and Shield Mastery.
- **Arythea the Raging** — All offense, all the time. Burns bright and sometimes burns herself. Starts with Dark Fire and Battle Frenzy.
- **Goldyx the Dragon** — Master of gold mana and crystals. Mysterious and powerful. Starts with Will of Gold and Golden Greed.

## Scenarios

- **First Reconnaissance** — 3 rounds. Explore the land and conquer a keep. The introductory scenario.
- **Solo Conquest** — 6 rounds. Build your power and conquer a city before time runs out.
- **Full Conquest** — 6 rounds. Conquer every city on the map. Good luck.

## Playing

```
python3 -m http.server 8085
open http://localhost:8085
```

Click hexes to move. Play cards from your hand for movement, combat, influence, or healing. Scroll to zoom, drag to pan. Press `C` to snap the camera back to your hero, `E` to end your turn, or `1`–`9` to select cards by position.

No install, no dependencies, no build step. Just a browser.

## Differences from the Physical Game

This is a faithful adaptation of the solo game, with some simplifications:

- Enemy spawns are randomized rather than drawn from token pools
- Unit recruitment uses a rotating offer rather than the full unit deck
- Some advanced enemy abilities (Summoner, Arcane) are simplified
- Artifacts are not yet implemented
- Multiplayer is not supported

The core loop — explore, fight, level, conquer — plays true to the original.

## Credits

[Mage Knight Board Game](https://boardgamegeek.com/boardgame/96848/mage-knight-board-game) designed by Vlaada Chvátil, published by WizKids. This is a fan project for personal use.

## License

This project is not affiliated with or endorsed by WizKids or the original designers.
