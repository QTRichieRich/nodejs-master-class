/**
 * Library for Storing & Editing Data
 */

//Dependancies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

 //Module Container
const lib = {};

// Base Directory of the Data Folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Writes Data to a file
lib.create = (dir, file, data, callback) => {
  
  // Open File for Writing
  fs.open(lib.baseDir + dir + '/'+ file + '.json', 'wx', (err, fileDescriptor) => {
    if (!err & fileDescriptor) {
      // Convert Data to String 
      const stringData = JSON.stringify(data);

      // Write to File & Close
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (!err){
          fs.close(fileDescriptor, (err)=>{
            if (!err) {
              callback(false);
            }else{
              callback("Error Closing File");
            }
          })
        }else{
          callback('Error writing to the new file');
        }
      })
    }else {
      //Call Back with Error 
      callback('Could not create new file, it may already exist');
    }
  });

};

// Read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', (err, data) => {
    if(!err && data) {
      var parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    }else{
      callback(err, data);
    }
  });
};


// Update data inside file
lib.update = (dir, file, data, callback) => {
  //Open File for writting
  fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', (err, fileDescriptor) => {
    if(!err && fileDescriptor) {

      var stringData = JSON.stringify(data);
      fs.ftruncate(fileDescriptor, (err) => {
        if (!err) {
          
          //write data to the files
          fs.writeFile(fileDescriptor, stringData, (err) => {
            if (!err) {
              fs.close(fileDescriptor, (err)=>{
                if (!err) {
                  callback(false);
                }else{
                  callback("Error Closing File");
                }
              });
            }else{
              callback('Error writing to file');
            };
          });
        }else{
          callback('Error truncating');
        };
      });

    }else{
      callback('Could not open the file for updating, it may not exist yet');
    }
  });
};

// Delete a file
lib.delete = (dir, file, callback) => {
  //Unlink from FS

  fs.unlink(lib.baseDir+dir+'/'+file+'.json', (err) => {
    if (!err) {
      callback(false);
    }else{
      callback('Error Deleting File');
    };
  });

};

//List all items in a direcotyr
lib.list = (dir, callback) => {
  fs.readdir(lib.baseDir+'dir'+'/', (err, data) => {
    if(!err && data && data.length > 0){
      let trimmedFileNames = [];
      data.forEach( (fileName) => {
        trimmedFileNames.push(fileName.replace('.json', ''));
      });
      callback(false, trimmedFileNames);
    }else{
      callback(err, data);
    }
  })
}

 //Export Module
 module.exports = lib;