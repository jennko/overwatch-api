import cheerio from 'cheerio';
import rp from 'request-promise';
import { getPrestigeLevel } from './utils';

export default function(platform, region, tag, cb) {

  const url = platform === 'pc'
    ? `https://playoverwatch.com/en-us/career/${platform}/${region}/${tag}`
    : `https://playoverwatch.com/en-us/career/${platform}/${tag}`;

  const options = {
    uri: encodeURI(url),
    encoding: 'utf8'
  }

  rp(options).then((htmlString) => {

    // Begin html parsing.
    const $ = cheerio.load(htmlString);
    const user = $('.header-masthead').text();
    const level = $('.player-level div').first().text();
    const portrait = $('.player-portrait').attr('src');

    // Get prestige level by matching .player-level background url hex.
    const prestigeEl = $('.player-level').first().attr('style');
    const prestigeHex = prestigeEl.match(/0x0*[1-9a-fA-F][0-9a-fA-F]*/);
    const prestigeLevel = prestigeHex ? getPrestigeLevel(prestigeHex[0]) : 0;

    const won = {};
    const lost = {};
    const draw = {};
    const played = {};
    const time = {};

    let compRank;
    let compRankImg;
    let star = '';

    const quickplayWonEl = $('#quickplay td:contains("Games Won")').next().html();
    const quickplayPlayedEl = $('#quickplay td:contains("Games Played")').next().html();
    const quickplayTimePlayedEl = $('#quickplay td:contains("Time Played")').next().html();

    const compWonEl = $('#competitive td:contains("Games Won")').next().html();
    const compPlayedEl = $('#competitive td:contains("Games Played")').next().html();
    const compLostEl = $('#competitive td:contains("Games Lost")').next().html();
    const compDrawEl = $('#competitive td:contains("Games Tied")').next().html();
    const compTimePlayedEl = $('#competitive td:contains("Time Played")').next().html();
    const compRankEl = $('.competitive-rank');

    const levelFrame = $('.player-level').attr('style').slice(21, 109);
    const starEl = $('.player-level .player-rank').html();

    if (compRankEl !== null) {
      compRankImg = $('.competitive-rank img').attr('src') || null;
      compRank = $('.competitive-rank div').html();
    }

    if (quickplayWonEl !== null) {
      won.quickplay = quickplayWonEl.trim().replace(/,/g, '');
    }

    if (quickplayPlayedEl !== null) {
      played.quickplay = quickplayPlayedEl.trim().replace(/,/g, '');
    }

    if (quickplayTimePlayedEl !== null) {
      time.quickplay = quickplayTimePlayedEl.trim().replace(/,/g, '');
    }

    if (compWonEl !== null) {
      won.competitive = compWonEl.trim().replace(/,/g, '');
    }

    if (compLostEl !== null) {
      lost.competitive = compLostEl.trim().replace(/,/g, '');
    }

    if (compDrawEl !== null) {
      draw.competitive = compDrawEl.trim().replace(/,/g, '');
    }

    if (compPlayedEl !== null) {
      played.competitive = compPlayedEl.trim().replace(/,/g, '');
    }

    if (compTimePlayedEl !== null) {
      time.competitive = compTimePlayedEl.trim().replace(/,/g, '');
    }

    if (starEl !== null) {
      star = $('.player-level .player-rank').attr('style').slice(21, 107);
    }

    const json = {
      username: user,
      level: parseInt(level) + prestigeLevel,
      portrait: portrait,
      games: {
        quickplay: {
          won: parseInt(won.quickplay),
          played: parseInt(played.quickplay) || undefined 
        },
        competitive: {
          won: parseInt(won.competitive),
          lost: parseInt(lost.competitive),
          draw: parseInt(draw.competitive) || 0,
          played: parseInt(played.competitive)
        },
      },
      playtime: { quickplay: time.quickplay, competitive: time.competitive },
      competitive: { rank: parseInt(compRank), rank_img: compRankImg },
      levelFrame: levelFrame,
      star: star
    }

    cb(json);
  }).catch(err => {
    cb(err);
  });
}
