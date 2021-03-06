import _ from 'lodash';
'use strict';

(function() {
    const fs = require('fs'),
      ct = require('./constants'),
      ejs = require('ejs'),
      inflection = require('inflection'),
      fse = require('fs-extra'),
      path = require('path'),
      appRoot = __dirname.replace('/bin','').replace('/lib','');

    const DissectController = function(scaffold, model, config) {
      try {
        this.scaffold = scaffold;
        this.model = model;
        this.config = config;
        this.fields = model.fields;
        this.associations = model.associations;
        this.modelName = inflection.camelize(model.name, false);

        this.nameClassify = inflection.camelize(model.name);
        this.nameSingular = inflection.singularize(model.name.toLowerCase());
        this.namePlural = inflection.pluralize(model.name.toLowerCase());
        this.nameSingularCap = inflection.camelize(this.nameSingular);
        this.namePluralCap = inflection.camelize(this.namePlural);
      } catch (e) {
        throw e;
      }
    };

    DissectController.prototype = {
        dissect: async function() {
          try {
            const config = this.config;
            await this.exportModel(path.join(
              config.dest,
              '/api/models',
              `/${this.modelName}.js`,
            ));
          } catch (e) {
            throw e;
          }
        },

        /* 
         * make associations
         */
        exportModelAss: async function() {
          const associations = this.model.associations;
          let modelAssociation = '';

          // check BelongsTo
          const hasBelongsTo = !_.isNil(associations) && _.has(associations, 'belongsTo');
          if (hasBelongsTo) {
            let index = 0;
            for (const ass of associations.belongsTo) {
              if (index !== 0) modelAssociation += '\n';
              modelAssociation += `${ass}.hasOne(${this.modelName});\n`;
              modelAssociation += `${this.modelName}.belongsTo(${ass});\n`;
              index++;
            }
          }

          // check HasMany (1 to Many)
          const hasHasMany = !_.isNil(associations) && _.has(associations, 'hasMany');
          if (hasHasMany) {
            for (const ass of associations.hasMany) {
              modelAssociation += `${ass}.hasMany(${this.modelName});`;
              modelAssociation += `${this.modelName}.belongsTo(${ass});\n`;
            }
          }

          // check BelongsToMany (Many to Many)
          const hasBelongsToMany = _.has(this.associations, 'belongsToMany');
          const tableArray = [];
          if (hasBelongsToMany) {
            for (const ass of associations.belongsToMany) {
              tableArray.push(ass);
            }
          }
          for (let i = (tableArray.length - 1); i >= 0; i--) {
            for (let j = 0; j <= tableArray.length-1; j++) {
                if(i !== j){
                  // console.log('i,j', i, j);
                  // console.log('tableArray[i],tableArray[j]', tableArray[i], tableArray[j]);
                  modelAssociation += `
                    ${tableArray[i]}.belongsToMany(${tableArray[j]}, {
                      through: ${this.modelName},
                      foreignKey: {
                        name: '${tableArray[i]}Id',
                        as: '${inflection.pluralize(tableArray[j])}',
                      },
                    });`;
                }
              }
          }
          return modelAssociation;
        },

        exportModel: async function (exportFilePath) {
          try {
            let modelColumn = '';
            for (const column of this.model.fields) {
              // console.log('!!!! column=>', column);
              const name = inflection.camelize(column.name, true);
              if (name.toLowerCase() === 'id') {
                continue;
              }
              const columnType = column.type.toLowerCase();
              switch (columnType) {
                case 'char':
                  modelColumn += `
                    ${name}: {
                      type: ${this.toSequelizeType(columnType)},
                      defaultValue: Sequelize.UUIDV4,
                      primaryKey: true,
                    },\n`;
                  break;

                case 'virtual':
                  modelColumn += `
                    ${name}: {
                      type: ${this.toSequelizeType(columnType)}${column.length ? `(${column.length})` : '' },
                      get: function() {},
                      set: function() {},
                    },\n`;
                  break;

                case 'enum':
                  modelColumn +=`
                    ${name}: {
                      type: ${this.toSequelizeType(columnType)}(${column.param.slice(1,-1)}),`
                    if (column.allowNull) {
                      modelColumn += `${column.allowNull ? 'allowNull: true,' : 'allowNull: false,'}`;
                    }
                    if (column.unique) {
                      modelColumn += 'unique: true,';
                    }
                    if (column.default) {
                      modelColumn += `defaultValue: ${this.getColumnDefaultType(column)},`;
                    }
                    modelColumn += `},\n`;
                  break;
              
                default:
                  modelColumn +=`
                    ${name}: {
                        type: ${this.toSequelizeType(columnType)}${column.length ? `(${column.length})` : '' },`;
                    if (column.allowNull) {
                      modelColumn += `${column.allowNull ? 'allowNull: true,' : 'allowNull: false,'}`;
                    }
                    if (column.unique) {
                      modelColumn += 'unique: true,';
                    }
                    if (column.default) {
                      modelColumn += `defaultValue: ${this.getColumnDefaultType(column)},`;
                    }
                    modelColumn += `},\n`;
                  break;
              }
            }
            const modelAssociation = await this.exportModelAss();
            const filePath = path.join(appRoot, '/tmpl/model.ejs');
            const str = await fs.readFileSync(filePath, 'utf8');
            const buffer = ejs.render(str, {
              ...this, 
              modelColumn,
              modelAssociation,
            });
            const isExist = await fs.existsSync(exportFilePath);
            if (!isExist) {
              await fs.writeFileSync(exportFilePath, buffer);
            }
          } catch (e) {
            throw e;
          }
        },

        getColumnDefaultType(column) {
          let defaultValue;
          const type = column.type.toLowerCase();
          if (type === 'string' || type === 'enum' ) {
            defaultValue = `\'${column.default}\'`;
          } else {
            defaultValue = column.default;
          }
          return defaultValue;
        },

        toSequelizeType: (type) => {
          try {
            switch (type.toLowerCase()) {
              case 'string':
              case 'str':
                return 'Sequelize.STRING';
              case 'integer':
              case 'int':
                return 'Sequelize.INTEGER';
              case 'double':
                return 'Sequelize.DOUBLE';
              case 'decimal':
                return 'Sequelize.DECIMAL';
              case 'date':
                return 'Sequelize.DATE';
              case 'tinyint':
              case 'boolean':
              case 'bool':
                return 'Sequelize.BOOLEAN';
              case 'virtual':
                return 'Sequelize.VIRTUAL';
              case 'enum':
                return 'Sequelize.ENUM';
              case 'text':
                return 'Sequelize.TEXT';
              case 'char':
                return 'Sequelize.UUID';
              default:
                return 'Sequelize.STRING';
            }
          } catch (e) {
            throw e;
          }
        },
    };

    exports.dissect = async function({ scaffold, model, config }) {
      try {
        const controller = new DissectController(scaffold, model, config);
        await controller.dissect();
      } catch (e) {
        throw e;
      }
    };
})();
