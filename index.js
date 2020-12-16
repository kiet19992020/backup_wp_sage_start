#!/usr/bin/env node
const program = require('commander');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');

program
    .version('1.0.0')
    .description('Clone db from 9thwonder dev');

///////////////
program
    .command('clone-db')
    .description('acc contact')
    .action(() => {
        const rmExistDb = () => {
            return new Promise(function (resolve, reject) {
                exec('rm -rf db_tmp.sql', (err, stdout, stderr) => {
                    if (err) {
                        // console.log(err)
                        return reject(err)
                    }
                })
                resolve()
            })
        }

        const copyDb = () => {
            return new Promise(function (resolve, reject) {
                const timeout = setInterval(function () {
                    const file = "wp-config.php";
                    const fileExists = fs.existsSync(file);
                    if (fileExists) {
                        clearInterval(timeout);
                        exec('wp config get CLONE_DB --allow-root', (err, stdout, stderr) => {
                            if (err) {
                                return reject( new Error(err));
                            }
                            var db_name = stdout ? stdout : 'db_start'
                            axios.get('http://tool.carbon8dev.com/export-db/dnm-db.php?db_name=' + db_name)
                                .then(function (response) {
                                    if (typeof response.data != 'undefined') {
                                        var sql_content = response.data
                                        if (sql_content.length > 0) {
                                            fs.writeFile("db_tmp.sql", sql_content, function (err) {
                                                if (err) {
                                                    return reject( new Error(err));
                                                }
                                                resolve()
                                            })

                                        }
                                    }
                                })
                        })
                    }
                }, 1000);
            })
        }
        const resetDb = () => {
            return new Promise((resolve, reject) => {
                exec('wp db reset --yes --allow-root;wp db drop --yes --allow-root', (err, stdout, stderr) => {
                    if (err) {
                        return reject( new Error(err))
                    }
                    resolve()
                })
            })
        }

        const createDb = () => {
            return new Promise((resolve, reject) => {
                exec('wp db create --allow-root', (err, stdout, stderr) => {
                    if (err) {
                        return reject(new Error(err))
                    }
                    resolve()
                })
            })
        }

        const importDb = () => {
            return new Promise((resolve, reject) => {
                exec(' wp db import db_tmp.sql --allow-root', (err, stdout, stderr) => {
                    if (err) {
                        return reject(new Error(err))
                    }
                    resolve()
                })
            })
        }

        const getNewDomain = () => {
            return new Promise((resolve, reject) => {
                exec(' wp config get WP_SITEURL --allow-root', (err, stdout, stderr) => {
                    if (err) {
                        return reject(new Error(err))
                    }
                    var newDomain = stdout
                    resolve(newDomain)
                })
            })
        }

        const getOldDomain = () => {
            return new Promise((resolve, reject) => {
                exec('wp option get siteurl --allow-root', (err, stdout, stderr) => {
                    if (err) {
                        return reject(new Error(err))
                    }
                    var oldDomain = stdout
                    resolve(oldDomain)
                })
            })
        }

        const replaceDomain = () => {
            return new Promise((resolve, reject) => {
                (async () => {
                    let newDomain = await getNewDomain()
                    let oldDomain = await getOldDomain()
                    if (newDomain.length > 0 && oldDomain.length > 0) {
                        oldDomain = oldDomain.replace("\n", "")
                        var exce = 'wp search-replace ' + oldDomain + ' ' + newDomain + ' --allow-root'
                        exce = exce.replace("\n", "")
                        exec(exce, (err, stdout, stderr) => {
                            if (err) {
                                return reject(new Error(err))
                            }
                            resolve()
                        })
                    }else{
                        return reject('Empty new domain or old domain')
                    }
                    
                })()
            })

        }

        const replaceDomainDefault = () => {
            return new Promise((resolve, reject) => {
                (async () => {
                    let newDomain = await getNewDomain()
                    let oldDomain = await getOldDomain()
                    if (newDomain.length > 0 && oldDomain.length > 0) {
                        oldDomain = oldDomain.replace("\n", "")
                        var exce = 'wp search-replace https://start.ubu.carbon8test.com ' + newDomain + ' --allow-root'
                        exce = exce.replace("\n", "")
                        exec(exce, (err, stdout, stderr) => {
                            if (err) {
                                return reject(new Error(err))
                            }
                            resolve()
                        })
                    }else{
                        return reject('Empty new domain or old domain')
                    }
                    
                })()
            })

        }

        const rmTmpDb = () => {
            return new Promise((resolve, reject) => {
                exec('rm -rf db_tmp.sql', (err, stdout, stderr) => {
                    fs.readFile('docker-compose.yml', 'utf8', function (err, data) {
                        if (err) {
                            return reject(new Error(err));
                        }
                        var result = data.replace(/command:/g, '#command:');
                        fs.writeFile('docker-compose.yml', result, 'utf8', function (err) {
                            if (err) {
                                return reject(err);
                            }
                            console.log("Finished")
                            resolve("Finished")
                        });
                    });

                })
            })
        }

        const activeTheme = (themeName) => {
            return new Promise((resolve, reject) => {
                console.log(themeName,'activeTheme')
                exec('wp theme activate '+themeName+'/resources --allow-root', (err, stdout, stderr) => {
                    if (err) {
                        return reject(new Error(err));
                    }
                    console.log("actived new theme")

                })
            })
        }

        const replaceThemeInGitIgnore= (themeName) => {
            return new Promise((resolve, reject) => {
                    fs.readFile(`.gitignore`, 'utf8', function (err, data) {
                        if (err) {
                            return reject(new Error(err));
                        }
                        var result = data.replace(/sage-theme/g, themeName);

                        fs.writeFile(`.gitignore`, result, 'utf8', function (err) {
                            if (err) {
                                return reject(err);
                            }
                            console.log("renamed .gitignore")
                            activeTheme(themeName)
                        });
                    });

            })
        }

        const replaceThemeInStyle = (themeName) => {
            return new Promise((resolve, reject) => {
                    fs.readFile(`wp-content/themes/${themeName}/resources/style.css`, 'utf8', function (err, data) {
                        if (err) {
                            return reject(new Error(err));
                        }
                        let themeTitle = themeName.replace('-',' ')
                        var result = data.replace(/Sage Theme/g, themeTitle);

                        fs.writeFile(`wp-content/themes/${themeName}/resources/style.css`, result, 'utf8', function (err) {
                            if (err) {
                                return reject(err);
                            }
                            console.log("renamed style")
                            replaceThemeInGitIgnore(themeName)
                            
                        });
                    });

            })
        }


        const getThemeActive = () => {
            return new Promise((resolve, reject)=>{
                exec(' wp config get WP_THEME_ACTIVE --allow-root', (err, stdout, stderr) => {
                    if (err) {
                        return reject(new Error(err))
                    }
                    var themeActive = stdout
                    resolve(themeActive)
                })
            })
        }

        const renameTheme = () => {
            return new Promise((resolve, reject)=>{
                (async() => {
                    let getThemeActiveConst = await getThemeActive()
                    getThemeActiveConst = getThemeActiveConst.replace("\n", "")
                    try{

                        if (getThemeActiveConst !== 'sage-theme' && fs.existsSync(`wp-content/themes/sage-theme/`) && !fs.existsSync(`wp-content/themes/${getThemeActiveConst}`)) {
                            console.log('renameTheme')
                            fs.renameSync(`wp-content/themes/sage-theme`, `wp-content/themes/${getThemeActiveConst}`, (err) => {
                              if (err) {
                                throw err;
                              }
                              fs.statSync(`wp-content/themes/${getThemeActiveConst}/`, (error, stats) => {
                                if (error) {
                                  throw error;
                                }
                                console.log(`stats: ${JSON.stringify(stats)}`);
                              });
                            });
                            await replaceThemeInStyle(getThemeActiveConst)

                          }


                    }catch(e){
                        // do nothing (not exist theme sage)
                    }
                    


                })()
            })
        }
        

        (async () => {
            try {
                await rmExistDb();
                await copyDb();
                await resetDb()
                await createDb()
                await importDb()
                await replaceDomain()
                await replaceDomainDefault()
                await rmTmpDb()
                await renameTheme()
            } catch (error) {
                console.log(error+'')
            }
        })()

    });
program.parse(process.argv)