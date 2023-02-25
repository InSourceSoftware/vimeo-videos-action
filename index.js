const core = require('@actions/core');
const github = require('@actions/github');
const request = require('request');
const fs = require('fs');

const VIMEO_URL = 'https://api.vimeo.com';
const THUMBNAIL_SIZE_WIDTHS = {
  'xs': 100,
  'sm': 200,
  'ms': 295,
  'md': 640,
  'ml': 960,
  'lg': 1280,
  'xl': 1920
};

main();

function main() {
  const accessToken = core.getInput('access-token');
  console.log('accessToken=***')
  const showcaseId = core.getInput('showcase-id');
  console.log(`showcase-id=${showcaseId}`);
  const thumbnailSize = core.getInput('thumbnail-size');
  console.log(`thumbnailSize=${thumbnailSize}`);
  const outputPath = core.getInput('output-path');
  console.log(`outputPath=${outputPath}`);
  const outputFilenameTemplate = core.getInput('output-filename-template');
  console.log(`outputFilenameTemplate=${outputFilenameTemplate}`);
  const outputContentTemplate = core.getInput('output-content-template');
  console.log(`outputContentTemplate=${outputContentTemplate}`);

  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`payload=${payload}`);

  console.log('Fetching videos...');
  try {
    fetchVideos(accessToken, showcaseId, thumbnailSize, outputPath, outputFilenameTemplate, outputContentTemplate)
      .then(() => console.log('finished'));
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}

async function fetchVideos(accessToken, showcaseId, thumbnailSize, outputPath, outputFilenameTemplate, outputContentTemplate) {
  let data = await fetchPage(accessToken, showcaseId, null);
  console.log(`found ${data.total} total results`);
  const items = data.data;
  while (data.paging && data.paging.next !== null) {
    data = await fetchPage(accessToken, showcaseId, data.page + 1);
    data.data.forEach(item => items.push(item));
  }

  for (let index in items) {
    const item = items[index];
    const filename = template(outputFilenameTemplate, item, index, thumbnailSize);
    const content = template(outputContentTemplate, item, index, thumbnailSize);
    await writeFile(outputPath, filename, content);
  }
}

function fetchPage(accessToken, showcaseId, page) {
  return new Promise((resolve, reject) => {
    let url = `${VIMEO_URL}/me/albums/${showcaseId}/videos?per_page=100&sort=date&direction=desc`;
    if (page !== null) {
      url = `${url}&page=${page}`;
      console.log(`fetching page ${page} of ${showcaseId}`);
    } else {
      console.log(`fetching first page of ${showcaseId}`);
    }
    const options = {
      'method': 'GET',
      'url': url,
      'headers': {
        'Authorization': `Bearer ${accessToken}`
      }
    };
    request(options, (error, response) => {
      if (error) {
        reject(error);
      }
      resolve(JSON.parse(response.body));
    });
  });
}

function writeFile(outputPath, filename, content) {
  return new Promise((resolve, reject) => {
    fs.mkdir(outputPath, { recursive: true }, (error) => {
      if (error) {
        reject(error);
      }
      fs.writeFile(`${outputPath}/${filename}`, content, { encoding: 'utf-8' }, resolve);
    });
  });
}

function template(str, item, index, thumbnailSize) {
  const thumbnail = findThumbnail(item.pictures.sizes, thumbnailSize) || items.pictures.base_link;
  return str
    .replace('${uri}', item.uri)
    .replace('${name}', clean(item.name))
    .replace('${description}', clean(item.description))
    .replace('${thumbnailLink}', thumbnail.link)
    .replace('${link}', item.link)
    .replace('${playerEmbedUrl}', item.player_embed_url)
    .replace('${duration}', item.duration)
    .replace('${width}', item.width)
    .replace('${height}', item.height)
    .replace('${userName}', clean(item.user.name))
    .replace('${userUri}', item.user.uri)
    .replace('${userLink}', item.user.link)
    .replace('${userBio}', clean(item.user.bio))
    .replace('${userShortBio}', clean(item.user.short_bio))
    .replace('${position}', Number.parseInt(index) + 1)
    .replace('${videoId}', item.uri.replace(/\/videos\//, ''))
    .replace('${createdTime}', item.created_time)
    .replace('${modifiedTime}', item.modified_time)
    .replace('${releaseTime}', item.release_time);
}

function clean(str) {
  return str == null ? null : str
    .replaceAll('\n', '\\n')
    .replaceAll('\'', '\'\'')
    .replaceAll('"', '\\"');
}

function findThumbnail(sizes, thumbnailSize) {
  const width = THUMBNAIL_SIZE_WIDTHS[thumbnailSize];
  return sizes.find((item, index) => item.width === width);
}