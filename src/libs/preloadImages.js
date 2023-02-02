function preloadImages(images) {
    if (document.images) {
        let i = 0;
        let imageArray = images;
        let imageObj = new Image();

        for(i; i <= imageArray.length-1; i++) {
            imageObj.src=imageArray[i];
        }
    }
}
