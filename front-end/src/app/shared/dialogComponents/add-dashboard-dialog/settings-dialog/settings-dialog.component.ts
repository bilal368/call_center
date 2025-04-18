import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { UserService } from '../../../../core/services/user/user.service';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { FilterEmployeemanagerComponent } from '../../../../filter-employeemanager/filter-employeemanager.component';
import { DashboardService } from '../../../../core/services/dashboard/dashboard.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/authentication/auth.service';
import { RolesAndPrivilegesService } from '../../../../core/services/rolesAndPrivileges/roles-and-privileges.service';
// import { TodoItemFlatNode } from '../configure/roles-privileges/roles-privileges.component';
/**
 * Food data with nested structure.
 * Each node has a name and an optional list of children.
 */
export class TreeNode {
  name!: string;
  id!: number;
  item!: string;
  checked!: boolean;
  children!: TreeNode[];
  locationId?: number;
  departmentId?: number;  // Optional property for departments
  divisionId?: number;     // Optional property for divisions
  extensionNumber?: number;        // Optional property for users
}
export class TodoItemNode {
  children!: TodoItemNode[];
  item!: string;
  id!: number;
  name!: string;
  locationId?: number;
  departmentId?: number;  // Optional property for departments
  divisionId?: number;     // Optional property for divisions
  extensionNumber?: number;        // Optional property for users
}

/** Flat to-do item node with expandable and level information */
export class TodoItemFlatNode {
  item!: string;
  level!: number;
  expandable!: boolean;
  checked!: boolean;
  id!: number;
  name!: string;
  locationId?: number;
  departmentId?: number;  // Optional property for departments
  divisionId?: number;     // Optional property for divisions
  extensionNumber?: number;        // Optional property for users
}

@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<TreeNode[]>([]);

  get data(): TodoItemNode[] { return this.dataChange.value; }

  constructor() {
    // this.initialize(TREE_DATA);
  }

  initialize(TREE_DATA_2: any) {
    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as children.
    // const data = this.buildFileTree1(TREE_DATA_2, 0);
    const data = this.transformForTree(TREE_DATA_2);
    // Notify the change.
    this.dataChange.next(data);
  }
  transformForTree(data: any) {
    const transformedData: any[] = [];
    // Traverse and transform data structure into an array suitable for MatTreeFlatDataSource
    // (e.g., create objects with item and id properties for each node at the appropriate level)
    // You can leverage buildFileTree1 or create a new transformation logic here
    data.forEach((item: any) => {


      if (item.locationId) {

      }
      transformedData.push(item); // Assuming top-level items
      if (item.children) {
        // Process children recursively and add them to transformedData
      }
    });
    return transformedData;
  }

  buildFileTree(obj: any, level: number = 0): TreeNode[] {
    return Object.keys(obj).reduce<TreeNode[]>((accumulator, key) => {
      const value = obj[key];
      let node: TreeNode;

      // If the value is a number, create a node with the key as the item and value as id
      if (typeof value === 'number') {
        node = new TreeNode();
        node.item = key;
        node.id = value; // Use the value itself as ID
      } else {
        node = new TreeNode();
        node.item = key;

        // If the value is an object, recursively build the subtree
        if (value != null && typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1); // Return children directly
        }
      }

      // Add the node to the accumulator array
      return accumulator.concat(node);
    }, []);
  }

  /** Add an item to to-do list */

}

/**
* @title Tree with checkboxes
*/


@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  providers: [ChecklistDatabase],
  imports: [MatTreeModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatTabsModule, FormsModule],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.css'
})
export class SettingsDialogComponent {
  checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);

  treeControl: FlatTreeControl<TodoItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeNode, TodoItemFlatNode>;
  dataSourceTree: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;
  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  flatNodeMap = new Map<TodoItemFlatNode, TreeNode>();
  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TreeNode, TodoItemFlatNode>();
  filterData: any = {
    locationId: [],
    departmentId: [],
    divisionId: [],
    extensionNumber: []
  };
  requestData: any = {}; //body defined above
  arrayForGroupProcess: any = [] //array contains multiple group/users input
  dataPermissionIds: { [categoryId: string]: number[] } = {
    locationId: [],
    departmentId: [],
    divisionId: [],
    userId: [],
    extensionNumber: []
  };
  locationIds: any[] = [];
  departmentIds: any = [];
  divisionIds: any = [];
  extensionNumbers: any[] = [];
  selectedTabIndex: number = 0;
  extensions: any[] = []; // Array to store fetched extensions
  Agents: any[] = [];
  allSelected: boolean = false; // To track the "Select All" checkbox state
  userId: any;
  selectedAgentCodes: any;


  constructor(

    @Inject(MAT_DIALOG_DATA) public data: {
      name: string; message: string, clickedStatus: string, height: string, roleId: any, filterSettings: any, AgentfilterSettings:any 
},
    private database: ChecklistDatabase,
    private dialogeRef: MatDialogRef<FilterEmployeemanagerComponent>,
    private userApi: UserService,
    private dashboard: DashboardService,
    private authService: AuthService,
    private rolesApi:RolesAndPrivilegesService

  ) {
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(
      node => node.level,
      node => node.expandable
    );

    this.dataSourceTree = new MatTreeFlatDataSource(
      this.treeControl,
      new MatTreeFlattener(
        this.transformer,
        node => node.level,
        node => node.expandable,
        node => node.children
      )
    );

    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
      this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSourceTree = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    // this.dataSourceTree = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.database.dataChange.subscribe(data => {
      this.dataSourceTree.data = data;
    });
  }
  ngOnDestroy(): void {

    // throw new Error('Method not implemented.');
  }
  ngOnInit(): void {
    
    this.fetchExtensions();
    this.getDataforTree();
    // throw new Error('Method not implemented.');
    
    this.initializeTreeData();
    this.fetchUserExtensions();

    
    if (Array.isArray(this.data.filterSettings) && this.data.filterSettings.length > 0 && this.data.filterSettings[0].agentCode) {
         
      if (this.data.name == 'Agent Time Activity' && this.data.filterSettings[0].type == 1) {

        this.selectedAgentCodes = this.data.filterSettings[0].agentCode.split(',');
        this.fetchAgentCode();
      }
      else if (this.data.name == 'Agent Call Activity' && this.data.filterSettings[1].type == 2) {

        this.selectedAgentCodes = this.data.filterSettings[1].agentCode.split(',');
        this.fetchAgentCode();
      }
      
    } else {
      // Handle the case where filterSettings is not an array or does not contain the expected data
      console.log("Running fetchDefaultAgentCode because filterSettings is not valid or missing agentCode.");
      this.fetchDefaultAgentCode();
    }
    
  }

  // Event handler for when the tab changes
  onTabChanged(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
  }

  fetchExtensions() {
    this.dashboard.fetchExtensions().subscribe((result: any) => {   
      if (result.status) {
        this.extensions = result.Extensions.map((extension: any) => ({
          ...extension,
          selected: false, // Initialize selected state
        }));
      }

    })
  }
  // Fetch Agent Code
  fetchAgentCode() {
    this.dashboard.fetchAgentCode().subscribe((result: any) => {     
      
      if (result.status) {
        this.Agents = result.Agents.map((Agent: any) => ({
          ...Agent,
          selected: this.selectedAgentCodes.includes(Agent.agentCode),
        }));
      }     
    })
  }
  // Fetch Agent Code
  fetchDefaultAgentCode() {
    this.dashboard.fetchAgentCode().subscribe((result: any) => {     
   
      if (result.status) {
        this.Agents = result.Agents.map((Agent: any) => ({
          ...Agent,
          selected: false,
        }));
      }  
    })
  }
  // Fetch User Extensions
  fetchUserExtensions() {
    const extractData = this.authService.extractDataFromToken(localStorage.getItem('token'))
    this.userId = extractData.userId
    this.dashboard.fetchUserExtensions(this.userId).subscribe((result: any) => {
      console.log("result fetchUserExtensions",result);
      
      if (result.status) {

        if (!this.selectedTabIndex) {
          for (let value = 0; value < result.data.length; value++) {
            console.log("result.data[value].callRecordingDashboardUserFeatureId",result.data[value].callRecordingDashboardUserFeatureId);
            console.log("this.data.filterSettings.name",this.data.filterSettings.name);
            
            if ( this.data.filterSettings.name == "Station Time Activity") {
              
              if (!result.data[value].type) {
                // Assuming filterSettings.extensionNumber is a comma-separated string of extension numbers
                this.extensionNumbers = result.data[0].extensionNumber.split(',').map((num: string) => num.trim());        
                // Pre-select extensions based on the extensionNumbers array
                this.extensions.forEach((extension: any) => {
                  const extNumber = extension.extensionNumber ? String(extension.extensionNumber).trim() : 'Unknown';
                  extension.selected = this.extensionNumbers.includes(extNumber);
                });
                // Check if all extensions are selected
                this.checkIfAllSelected();
              }else{
                this.selectedTabIndex = 1
              }
            } else if ( this.data.filterSettings.name == "Station Call Activity") {
              if (!result.data[value].type) {
                // Assuming filterSettings.extensionNumber is a comma-separated string of extension numbers
                this.extensionNumbers = result.data[1].extensionNumber.split(',').map((num: string) => num.trim());
                // Pre-select extensions based on the extensionNumbers array
                this.extensions.forEach((extension: any) => {
                  const extNumber = extension.extensionNumber ? String(extension.extensionNumber).trim() : 'Unknown';
                  extension.selected = this.extensionNumbers.includes(extNumber);
                });
          
                // Check if all extensions are selected
                this.checkIfAllSelected();
              }else{
                this.selectedTabIndex = 1
              }
            }
          }
        }
      }
    })
  }

  // Toggle selection for all checkboxes
  toggleAllSelections() {
    this.extensions.forEach((extension) => {
      extension.selected = this.allSelected;
    });
  }
// Toggle Agent selection for all checkboxes
toggleAllAgentSelections() {
  this.Agents.forEach((agent) => {
    agent.selected = this.allSelected;
  });
}
  // Check if all items are selected when one checkbox is changed
  checkIfAllSelected() {
    this.allSelected = this.extensions.every((extension) => extension.selected); 
  }

  // Check if all items are selected when one checkbox is changed
  checkIfAgentAllSelected() {
    this.allSelected = this.Agents.every((agent) => agent.selected);
  }

  initializeTreeData() {
    let filterSettings  
    // Ensure filterSettings is defined
    if (this.data.filterSettings) {
      // Check if name is 'Station Time Activity' and pick the correct filter settings
      if (this.data.filterSettings.name === 'Station Time Activity') {
        filterSettings = this.data.filterSettings.filterdata[0];
      }

      // Check if name is 'Station Call Activity' and pick the correct filter settings
      if (this.data.filterSettings.name === 'Station Call Activity') {
        filterSettings = this.data.filterSettings[1];
      }

      if (filterSettings) {
        if (filterSettings.type) {
          this.locationIds = filterSettings.locationId.split(',').map((id: string) => parseInt(id.trim()));
          this.departmentIds = filterSettings.departmentId.split(',').map((id: string) => parseInt(id.trim()));
          this.divisionIds = filterSettings.divisionId.split(',').map((id: string) => parseInt(id.trim()));
          this.extensionNumbers = filterSettings.extensionNumber.split(',').map((id: string) => parseInt(id.trim()));
        }else{
          this.extensionNumbers = filterSettings.extensionNumber.split(',').map((num: string) => num.trim());
          
          // Pre-select extensions based on the extensionNumbers array
          this.extensions.forEach((extension: any) => {
            const extNumber = extension.extensionNumber ? String(extension.extensionNumber).trim() : 'Unknown';
            extension.selected = this.extensionNumbers.includes(extNumber);
          });
        }
      }
    } else {
      console.warn('filterSettings is undefined');
    }
  }

  validateData(node: any): boolean {    
    if (node.locationId) {
      // this.selectNodeAndChildren(node)
      return this.locationIds.includes(node.locationId);
    } else if (node.departmentId) {
      // this.selectNodeAndChildren(node)
      return this.departmentIds.includes(node.departmentId);
    } else if (node.divisionId) {
      // this.selectNodeAndChildren(node)
      return this.divisionIds.includes(node.divisionId);
    } else if (node.extensionNumber) {
      // this.selectNodeAndChildren(node)
      return this.extensionNumbers.includes(node.extensionNumber);
    }
    // this.onCheckboxChange(node)
    return false;
  }

  getDataforTree() {
    let body = {}
    this.rolesApi.getDataforDataRestrictions(body).subscribe((result: any) => {
      this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
      this.dataSourceTree = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
      this.database.initialize(result.Data);

      // Ensure dataChange subscription is done here to catch data changes immediately after initialization
      this.database.dataChange.subscribe(data => {
        this.dataSourceTree.data = data;
        // Call to initialize tree data after setting it
      });

    })
  }


  isNodeMatchingType(node: any, type: string): boolean {
    // Implement logic to match node to type ('location', 'department', etc.)
    return node.type === type;
  }


  getLevel = (node: TodoItemFlatNode) => node.level;

  isExpandable = (node: TodoItemFlatNode) => node.expandable;

  getChildren = (node: TreeNode): TreeNode[] => node.children;

  hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.item === '';

  hasAllChildrenChecked(node: any): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const uncheckedChildren = descendants.filter(child => !this.checklistSelection.isSelected(child));
    return uncheckedChildren.length === 0;
  }
  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TreeNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.item === node.item
      ? existingNode
      : new TodoItemFlatNode();
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.checked = node?.checked;
    flatNode.id = node?.id;
    flatNode.locationId = node?.locationId;
    flatNode.departmentId = node?.departmentId;
    flatNode.divisionId = node?.divisionId;
    flatNode.extensionNumber = node?.extensionNumber;
    flatNode.expandable = node.children?.length > 0;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }
  /** Whether all the descendants of the node are selected */
  descendantsAllSelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    // return descendants.every(child => this.checklistSelection.isSelected(child));
    const allSelected = descendants.every(child => this.checklistSelection.isSelected(child));
    return allSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    // const result = descendants.some(child => this.checklistSelection.isSelected(child));
    // return result && !this.descendantsAllSelected(node);
    const someSelected = descendants.some(child => this.checklistSelection.isSelected(child));
    const allSelected = descendants.every(child => this.checklistSelection.isSelected(child));
    return someSelected && !allSelected;
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);
  }

  onCheckboxChange(node: any, event: MatCheckboxChange): void {

    // Check if the checkbox is being checked or unchecked
    if (event.checked) {
      this.selectNodeAndChildren(node);
    } else {
      this.deselectNodeAndChildren(node);
    }


    // // Handle requestData and group/user processing
    // if (this.requestData.type === 'user') {
    //   const existingIndex = this.arrayForGroupProcess.findIndex(
    //     (item: any) => item.id === this.requestData.id
    //   );

    //   if (existingIndex === -1) {
    //     this.requestData.hierarchy = this.dataPermissionIds;
    //     this.arrayForGroupProcess.push(this.requestData);
    //   } else {
    //     // Update existing data in arrayForGroupProcess
    //     this.arrayForGroupProcess[existingIndex].hierarchy = this.dataPermissionIds;
    //   }
    // } else {
    //   const existingIndex = this.arrayForGroupProcess.findIndex(
    //     (item: any) => item.groupName === this.requestData.groupName
    //   );

    //   if (existingIndex === -1) {
    //     this.requestData.hierarchy = this.dataPermissionIds;
    //     this.arrayForGroupProcess.push(this.requestData);
    //   } else {
    //     // Update existing data in arrayForGroupProcess
    //     this.arrayForGroupProcess[existingIndex].hierarchy = this.dataPermissionIds;
    //   }
    // }
  }

  // Function to select a node and its children
  selectNodeAndChildren(node: any): void {
    // Add the node based on its level
    if (node.level === 0) {
      // Add locationId if it's not undefined
      if (node.locationId !== undefined && !this.locationIds.includes(node.locationId)) {
        this.locationIds.push(node.locationId);
      }
    } else if (node.level === 1) {
      // Add departmentId if it's not undefined
      if (node.departmentId !== undefined && !this.departmentIds.includes(node.departmentId)) {
        this.departmentIds.push(node.departmentId);
      }
    } else if (node.level === 2) {
      // Add divisionId if it's not undefined
      if (node.divisionId !== undefined && !this.divisionIds.includes(node.divisionId)) {
        this.divisionIds.push(node.divisionId);
      }
    } else if (node.level === 3) {
      // Add divisionId if it's not undefined
      if (node.extensionNumber !== undefined && !this.extensionNumbers.includes(node.extensionNumber)) {
        this.extensionNumbers.push(node.extensionNumber);
      }
    }

    // Get children of the node (if any) and recursively select them
    const children = this.treeControl.getDescendants(node);
    for (let child of children) {
      if (child.level === 1) {
        // Add departmentId for child if it's not undefined
        if (child.departmentId !== undefined && !this.departmentIds.includes(child.departmentId)) {
          this.departmentIds.push(child.departmentId);
        }
      } else if (child.level === 2) {
        // Add divisionId for child if it's not undefined
        if (child.divisionId !== undefined && !this.divisionIds.includes(child.divisionId)) {
          this.divisionIds.push(child.divisionId);
        }
      } else if (child.level === 3) {
        // Add divisionId for child if it's not undefined
        if (child.extensionNumber !== undefined && !this.extensionNumbers.includes(child.extensionNumber)) {
          this.extensionNumbers.push(child.extensionNumber);
        }
      }
    }
  }

  // Function to deselect a node and its children
 deselectNodeAndChildren(node: any): void {
  console.log('deselecting');

  // Remove the node based on its level
  if (node.level === 0 && node.locationId !== undefined) {
    const index = this.locationIds.indexOf(node.locationId);
    if (index !== -1) {
      this.locationIds.splice(index, 1);
    }
  } else if (node.level === 1 && node.departmentId !== undefined) {
    const index = this.departmentIds.indexOf(node.departmentId);
    if (index !== -1) {
      this.departmentIds.splice(index, 1);
    }
  } else if (node.level === 2 && node.divisionId !== undefined) {
    const index = this.divisionIds.indexOf(node.divisionId);
    if (index !== -1) {
      this.divisionIds.splice(index, 1);
    }
  } else if (node.level === 3 && node.extensionNumber !== undefined) {
    const index = this.extensionNumbers.indexOf(node.extensionNumber);
    if (index !== -1) {
      this.extensionNumbers.splice(index, 1);
    }
  }

  // Get children of the node (if any) and recursively deselect them
  const children = this.treeControl.getDescendants(node);
  for (let child of children) {
    this.deselectNodeAndChildren(child); // Recursively call deselectNodeAndChildren for each child node
  }
}

  applyFilter() {

    
    if (this.data.filterSettings.name == 'Station Time Activity' || this.data.filterSettings.name == 'Station Call Activity') {
      if (this.selectedTabIndex) {
        // Assign the current selected IDs to the filterData
        this.filterData.locationId = this.dataPermissionIds['locationId'];
        this.filterData.departmentId = this.dataPermissionIds['departmentId'];
        this.filterData.divisionId = this.dataPermissionIds['divisionId'];
        this.filterData.extensionNumber = this.dataPermissionIds['extensionNumber'];
        this.filterData.selectedTabIndex = this.selectedTabIndex;
        console.log("this.filterData",this.filterData);
        
        // Close the dialog and return the filter data
        this.dialogeRef.close(this.filterData);
      } else { 
        const selectedExtensions = this.extensions.filter((extension) => extension.selected);
        this.filterData.selectedExtensions = selectedExtensions;
        this.filterData.selectedTabIndex = this.selectedTabIndex;
        console.log("this.filterData111111111",this.filterData);

        this.dialogeRef.close(this.filterData);
      }
    }else{

      const selectedAgents = this.Agents.filter((agent) => agent.selected);
      if (selectedAgents.length > 0) {
        selectedAgents[0].name = this.data.filterSettings.name;
      }
      this.dialogeRef.close(selectedAgents);
    }
    

  }
  closeDialog() {
    this.dialogeRef.close()
  }

}
