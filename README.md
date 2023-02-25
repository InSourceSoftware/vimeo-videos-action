# Vimeo Videos Action

Fetch Vimeo videos from a Vimeo showcase (by showcase id or album id) and create
files or posts on a website.

## Inputs

### `access-token`

**Required** Vimeo personal access token with access to Vimeo API

### `showcase-id`

**Required** Vimeo showcase id or album id

### `thumbnail-size`

**Optional** Thumbnail image size name, one of xs, sm, ms, md, ml, lg, xl

### `output-path`

**Optional** Path to write output files to, defaults to `_data/videos`

### `output-filename-template`

**Optional** Output filename template for each output file including
placeholders, defaults to `${position}.yml`

### `output-content-template`

**Optional** Output content template for each output file including
placeholders[1], defaults to:

```
uri: '${uri}'
name: '${name}'
description: '${description}'
thumbnailLink: '${thumbnailLink}'
link: '${link}'
playerEmbedUrl: '${playerEmbedUrl}'
duration: '${duration}'
width: '${width}'
height: '${height}'
userName: '${userName}'
userUri: '${userUri}'
userLink: '${userLink}'
userBio: '${userBio}'
userShortBio: '${userShortBio}'
position: '${position}'
videoId: '${videoId}'
createdTime: '${createdTime}'
modifiedTime: '${modifiedTime}'
releaseTime: '${releaseTime}'
runs:
```

[1]: Placeholders currently include the following fields from the Vimeo
showcase response:

* `${uri}`
* `${name}`
* `${description}`
* `${thumbnailLink}`
* `${link}`
* `${playerEmbedUrl}`
* `${duration}`
* `${width}`
* `${height}`
* `${userName}`
* `${userUri}`
* `${userLink}`
* `${userBio}`
* `${userShortBio}`
* `${position}`
* `${videoId}`
* `${createdTime}`
* `${modifiedTime}`
* `${releaseTime}`

## Example usage

```yaml
uses: InSourceSoftware/vimeo-videos-action@v1
with:
  access-token: ${{ secrets.VIMEO_ACCESS_TOKEN }}
  showcase-id: 'xyz'
  thumbnail-size: 'lg'
  output-path: '_data/videos'
  output-filename-template: '${position}.yml'
  output-content-template: |
    uri: '${uri}'
    name: '${name}'
    description: '${description}'
    thumbnailLink: '${thumbnailLink}'
    link: '${link}'
    playerEmbedUrl: '${playerEmbedUrl}'
    duration: '${duration}'
    width: '${width}'
    height: '${height}'
    userName: '${userName}'
    userUri: '${userUri}'
    userLink: '${userLink}'
    userBio: '${userBio}'
    userShortBio: '${userShortBio}'
    position: '${position}'
    videoId: '${videoId}'
    createdTime: '${createdTime}'
    modifiedTime: '${modifiedTime}'
    releaseTime: '${releaseTime}'
```