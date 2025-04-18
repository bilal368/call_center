const ldap = require('ldapjs');
let client = null;
function initializeClient(ldapOptions) {//Authentication
  if (!client) {
    client = ldap.createClient(ldapOptions);
    client.on('error', (err) => {
      console.error('LDAP client error:', err);
    });
  }
  return client;
}
async function searchLDAP(baseDN, searchOptions, operationType, client) {//ldap Searching  
  let ldapStructure = [];
  let userAttributes = {};
  let ldapDetails = [];

  try {
    const res = await new Promise((resolve, reject) => {
      client.search(baseDN, searchOptions, (err, res) => {
        if (err) {
          reject(err);
          console.log("Err:",err);
        }
        resolve(res);
      });
    });

    await new Promise((resolve, reject) => {
      res.on('searchEntry', (entry) => {
        entry.attributes.forEach(attribute => {
          userAttributes[attribute.type] = attribute.values;
 
        });
        ldapDetails.push(userAttributes);
        ldapStructure.push(entry.dn.toString());

      });
      res.on('end', () => resolve());
      res.on('error', (err) => reject(err));
    });
    if (operationType === 'login') {
      return userAttributes;
    } else if (operationType === 'hierarchy') {
    
      return ldapStructure;
    }
    else if (operationType === 'details') {
      return ldapDetails;
    }
  } catch (err) {
    console.error('Error during LDAP search:', err);
    throw err;
  }
}
async function listLdapStructure(path, searchOpts, client) {
  console.log('path::',path);
  return new Promise((resolve, reject) => {
    client.bind('Administrator@eisf.co.ae', 'slt2020@', (err) => {
      if (err) {
        console.error('LDAP bind error:', err);
        return reject(err);
      }
      // const searchOpts = {
      //   filter: '(objectClass=person)',
      //   scope: 'sub', // Search scope: base, one, or sub 
      //   attributes: [], // Include desired attributes here
      // };

      client.search(path, searchOpts, (err, res) => {
        if (err) {
          console.error('LDAP search error:', err);
          return reject(err);
        }

        const ldapStructure = [];
        res.on('searchEntry', (entry) => {
          const userAttributes = {};
          entry.attributes.forEach(attribute => {
            userAttributes[attribute.type] = attribute.vals.join(', '); // Join attribute values if there are multiple
          });
          ldapStructure.push(userAttributes);
         
        });

        res.on('error', (err) => {
          console.error('LDAP search error:', err);
          reject(err);
        });

        res.on('end', () => {
          console.log('LDAP search ended');
          resolve(ldapStructure);
        });
      });
    });
  });
}


// Function to get members of a subgroup
async function getSubgroupMembers(groupName, path, client) {
  return new Promise((resolve, reject) => {
    client.bind('Administrator@eisf.co.ae', 'slt2020@', (err) => {
      if (err) {
        console.error('LDAP bind error:', err);
        return reject(err);
      }

      const options = {
        scope: 'sub',
        filter: `(cn=${groupName})`,
        attributes: ['MemberOf']
      };

      client.search(path, options, (err, res) => {
        if (err) {
          console.error('Error in search:', err);
          return reject(err);
        } else {
          let members = [];

          res.on('searchEntry', (entry) => {
            if (entry.object && entry.object.member) {
              const memberDNs = entry.object.member;
              if (Array.isArray(memberDNs)) {
                members = members.concat(memberDNs);
              } else if (typeof memberDNs === 'string') {
                members.push(memberDNs);
              }
            }
          });

          res.on('end', (result) => {
            if (result.status !== 0) {
              console.error('Non-zero status from LDAP search:', result.status);
              return reject(new Error('Non-zero status from LDAP search'));
            } else {
              resolve(members);
            }
          });

          res.on('error', (err) => {
            console.error('Error in search:', err);
            reject(err);
          });
        }
      });
    });
  });
}
module.exports = {
  initializeClient,
  searchLDAP,
  listLdapStructure,
  getSubgroupMembers
};


