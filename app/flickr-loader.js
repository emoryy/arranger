import $ from 'jquery';

export default function(tags = ['building', 'street', 'people', 'summer', 'girls']) {
  const promises = [];
  for (let i = 0; i < tags.length; i++) {
    promises.push(new Promise(function(resolve, reject) {
    var url = "http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?";
      $.getJSON( url, {
        format: "json",
        tags: tags[i],
        tagmode: "all"
      }).done(function(result) {
        resolve(result);
      });
    }));
  }
  return Promise.all(promises).then(function(results) {
    const allImages = [];
    results.forEach(function(result) {
      const images = result.items.map(function(item) {
        return {
          url: item.media.m,
          imp: (new Date(item.published)).getSeconds()
        }
      });
      allImages.push(...images);
    });
    return allImages;
  })
};

// jsonFlickrFeed({
// 		"title": "Uploads from everyone",
// 		"link": "https://www.flickr.com/photos/",
// 		"description": "",
// 		"modified": "2016-09-21T18:15:30Z",
// 		"generator": "https://www.flickr.com/",
// 		"items": [
// 	   {
// 			"title": "DSC_0608-01-01",
// 			"link": "https://www.flickr.com/photos/145350960@N02/29211063414/",
// 			"media": {"m":"https://farm9.staticflickr.com/8040/29211063414_8d78f2efcc_m.jpg"},
// 			"date_taken": "2016-05-15T16:46:37-08:00",
// 			"description": " <p><a href=\"https://www.flickr.com/people/145350960@N02/\">nataliaocampo1<\/a> posted a photo:<\/p> <p><a href=\"https://www.flickr.com/photos/145350960@N02/29211063414/\" title=\"DSC_0608-01-01\"><img src=\"https://farm9.staticflickr.com/8040/29211063414_8d78f2efcc_m.jpg\" width=\"240\" height=\"135\" alt=\"DSC_0608-01-01\" /><\/a><\/p> ",
// 			"published": "2016-09-21T18:15:30Z",
// 			"author": "nobody@flickr.com (nataliaocampo1)",
// 			"author_id": "145350960@N02",
// 			"tags": ""
// 	   },
//
// 	   {
// 			"title": "DSC_0324.jpg",
// 			"link": "https://www.flickr.com/photos/haniph/29802938956/",
// 			"media": {"m":"https://farm9.staticflickr.com/8225/29802938956_183f55d23d_m.jpg"},
// 			"date_taken": "2016-09-20T22:43:37-08:00",
// 			"description": " <p><a href=\"https://www.flickr.com/people/haniph/\">haniph<\/a> posted a photo:<\/p> <p><a href=\"https://www.flickr.com/photos/haniph/29802938956/\" title=\"DSC_0324.jpg\"><img src=\"https://farm9.staticflickr.com/8225/29802938956_183f55d23d_m.jpg\" width=\"240\" height=\"159\" alt=\"DSC_0324.jpg\" /><\/a><\/p> ",
// 			"published": "2016-09-21T18:15:32Z",
// 			"author": "nobody@flickr.com (haniph)",
// 			"author_id": "22877377@N00",
// 			"tags": ""
// 	   }
//         ]
// })