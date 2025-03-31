import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter } from './helpers/fileFilter.helper';


@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('File in Controler:', file);
    if(!file) {
      throw new BadRequestException('make sure the file is an image'); 
    }
    return file
  }

}
