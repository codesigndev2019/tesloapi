

export const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {

    console.log(file)

    if (!file) return cb(new Error('File is empty, please upload a file'), false);


    const fileExtension = file.mimetype.split('/')[1];

    const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];

    if (validExtensions.includes(fileExtension)) {
        return cb(null, true)
    }


    cb(null, false)

}