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
  const sort = core.getInput('sort');
  console.log(`thumbnailSize=${thumbnailSize}`);
  const order = core.getInput('order');
  console.log(`thumbnailSize=${thumbnailSize}`);
  const outputPath = core.getInput('output-path');
  console.log(`outputPath=${outputPath}`);
  const outputFilenameTemplate = core.getInput('output-filename-template');
  console.log(`outputFilenameTemplate=${outputFilenameTemplate}`);
  const outputContentTemplate = core.getInput('output-content-template');
  console.log(`outputContentTemplate=${outputContentTemplate}`);

  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`payload=${payload}`);

  console.log('Fetching videos...');
  try {
    fetchVideos(accessToken, showcaseId, thumbnailSize, sort, order, outputPath, outputFilenameTemplate, outputContentTemplate)
      .then(() => console.log('finished'));
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}

async function fetchVideos(accessToken, showcaseId, thumbnailSize, sort, order, outputPath, outputFilenameTemplate, outputContentTemplate) {
  let data = await fetchPage(accessToken, showcaseId, sort, order, null);
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

function fetchPage(accessToken, showcaseId, sort, order, page) {
  return new Promise((resolve, reject) => {
    let url = `${VIMEO_URL}/me/albums/${showcaseId}/videos?per_page=100&sort=${sort}`;
    if (order !== null) {
      url = `${url}&direction=${order}`;
    }
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
    .replaceAll('${uri}', item.uri)
    .replaceAll('${name}', clean(item.name))
    .replaceAll('${description}', clean(item.description))
    .replaceAll('${thumbnailLink}', thumbnail.link)
    .replaceAll('${link}', item.link)
    .replaceAll('${playerEmbedUrl}', item.player_embed_url)
    .replaceAll('${duration}', item.duration)
    .replaceAll('${width}', item.width)
    .replaceAll('${height}', item.height)
    .replaceAll('${userName}', clean(item.user.name))
    .replaceAll('${userUri}', item.user.uri)
    .replaceAll('${userLink}', item.user.link)
    .replaceAll('${userBio}', clean(item.user.bio))
    .replaceAll('${userShortBio}', clean(item.user.short_bio))
    .replaceAll('${position}', Number.parseInt(index) + 1)
    .replaceAll('${videoId}', item.uri.replace(/\/videos\//, ''))
    .replaceAll('${createdTime}', item.created_time)
    .replaceAll('${modifiedTime}', item.modified_time)
    .replaceAll('${releaseTime}', item.release_time);
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