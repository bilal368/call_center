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
import { UserService } from '../core/services/user/user.service';
import { RolesAndPrivilegesService } from '../core/services/rolesAndPrivileges/roles-and-privileges.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { error } from 'highcharts';



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
  // extensionNumber?: number;        // Optional property for users
}
export class TodoItemNode {
  children!: TodoItemNode[];
  item!: string;
  id!: number;
  name!: string;
  locationId?: number;
  departmentId?: number;  // Optional property for departments
  divisionId?: number;     // Optional property for divisions
  // extensionNumber?: number;        // Optional property for users
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
  // extensionNumber?: number;        // Optional property for users
}
/**
 * The Json object for to-do list data.
 */



@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<TreeNode[]>([]);

  get data(): TodoItemNode[] { return this.dataChange.value; }

  constructor() {
    this.initialize([]);
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
  selector: 'app-filter-employeemanager',
  standalone: true,
  providers: [ChecklistDatabase],
  imports: [MatTreeModule,MatDialogModule, MatButtonModule, MatIconModule, MatCheckboxModule,MatTooltipModule,TranslateModule],
  templateUrl: './filter-employeemanager.component.html',
  styleUrl: './filter-employeemanager.component.css'
})
export class FilterEmployeemanagerComponent implements OnInit, OnDestroy {
  checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);

  treeControl: FlatTreeControl<TodoItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeNode, TodoItemFlatNode>;
  dataSourceTree: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;
  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  flatNodeMap = new Map<TodoItemFlatNode, TreeNode>();
  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TreeNode, TodoItemFlatNode>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      divisionId: never[];
      departmentId: never[];
      locationId: never[]; message: string, clickedStatus: string, height: string, roleId: any ,callFilter:any
},
    public matdialoge: MatDialog,
    private database: ChecklistDatabase,
    private dialogeRef: MatDialogRef<FilterEmployeemanagerComponent>,
    private userApi: RolesAndPrivilegesService
  ) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
      this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSourceTree = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    // this.dataSourceTree = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.database.dataChange.subscribe(data => {
      this.dataSourceTree.data = data;
    });
  }

  toolTips:any={
    Close:'Menu.CONFIGURE.EMPLOYEE MANAGER.CLOSE',
  }
  ngOnDestroy(): void {

    // throw new Error('Method not implemented.');
  }
  ngOnInit(): void {
    this.getDataforTree();
    
    // throw new Error('Method not implemented.');
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
    // flatNode.extensionNumber = node?.extensionNumber;
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
    const someSelected = descendants.some(child => this.checklistSelection.isSelected(child) );
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
  requestData: any = {}; //body defined above
  arrayForGroupProcess: any = [] //array contains multiple group/users input
  dataPermissionIds: { [categoryId: string]: number[] } = {
    locationId: [],
    departmentId: [],
    divisionId: [],
    userId: [],
  };
onCheckboxChange(node: any, event: MatCheckboxChange): void {
  // Check if the checkbox is being checked or unchecked
  if (event.checked) {
    this.selectNodeAndChildren(node);
  } else {
    this.deselectNodeAndChildren(node);
  }

  console.log(this.dataPermissionIds);

  // Handle requestData and group/user processing
  if (this.requestData.type === 'user') {
    const existingIndex = this.arrayForGroupProcess.findIndex(
      (item: any) => item.id === this.requestData.id
    );

    if (existingIndex === -1) {
      this.requestData.hierarchy = this.dataPermissionIds;
      this.arrayForGroupProcess.push(this.requestData);
    } else {
      // Update existing data in arrayForGroupProcess
      this.arrayForGroupProcess[existingIndex].hierarchy = this.dataPermissionIds;
    }
  } else {
    const existingIndex = this.arrayForGroupProcess.findIndex(
      (item: any) => item.groupName === this.requestData.groupName
    );

    if (existingIndex === -1) {
      this.requestData.hierarchy = this.dataPermissionIds;
      this.arrayForGroupProcess.push(this.requestData);
    } else {
      // Update existing data in arrayForGroupProcess
      this.arrayForGroupProcess[existingIndex].hierarchy = this.dataPermissionIds;
    }
  }
}

// Function to select a node and its children
selectNodeAndChildren(node: any): void {
  // Add the node based on its level
  if (node.level === 0) {
    // Add locationId if it's not undefined
    if (node.locationId !== undefined && !this.dataPermissionIds['locationId'].includes(node.locationId)) {
      this.dataPermissionIds['locationId'].push(node.locationId);
    }
  } else if (node.level === 1) {
    // Add departmentId if it's not undefined
    if (node.departmentId !== undefined && !this.dataPermissionIds['departmentId'].includes(node.departmentId)) {
      this.dataPermissionIds['departmentId'].push(node.departmentId);
    }
  } else if (node.level === 2) {
    // Add divisionId if it's not undefined
    if (node.divisionId !== undefined && !this.dataPermissionIds['divisionId'].includes(node.divisionId)) {
      this.dataPermissionIds['divisionId'].push(node.divisionId);
    }
  }

  // Get children of the node (if any) and recursively select them
  const children = this.treeControl.getDescendants(node);
  for (let child of children) {
    if (child.level === 1) {
      // Add departmentId for child if it's not undefined
      if (child.departmentId !== undefined && !this.dataPermissionIds['departmentId'].includes(child.departmentId)) {
        this.dataPermissionIds['departmentId'].push(child.departmentId);
      }
    } else if (child.level === 2) {
      // Add divisionId for child if it's not undefined
      if (child.divisionId !== undefined && !this.dataPermissionIds['divisionId'].includes(child.divisionId)) {
        this.dataPermissionIds['divisionId'].push(child.divisionId);
      }
    }
  }
}

// Function to deselect a node and its children
deselectNodeAndChildren(node: any): void {
  // Remove the node based on its level
  if (node.level === 0 && node.locationId !== undefined) {
    const index = this.dataPermissionIds['locationId'].indexOf(node.locationId);
    if (index !== -1) {
      this.dataPermissionIds['locationId'].splice(index, 1);
    }
  } else if (node.level === 1 && node.departmentId !== undefined) {
    const index = this.dataPermissionIds['departmentId'].indexOf(node.departmentId);
    if (index !== -1) {
      this.dataPermissionIds['departmentId'].splice(index, 1);
    }
  } else if (node.level === 2 && node.divisionId !== undefined) {
    const index = this.dataPermissionIds['divisionId'].indexOf(node.divisionId);
    if (index !== -1) {
      this.dataPermissionIds['divisionId'].splice(index, 1);
    }
  }

  // Get children of the node (if any) and recursively deselect them
  const children = this.treeControl.getDescendants(node);
  for (let child of children) {
    if (child.level === 1 && child.departmentId !== undefined) {
      const index = this.dataPermissionIds['departmentId'].indexOf(child.departmentId);
      if (index !== -1) {
        this.dataPermissionIds['departmentId'].splice(index, 1);
      }
    } else if (child.level === 2 && child.divisionId !== undefined) {
      const index = this.dataPermissionIds['divisionId'].indexOf(child.divisionId);
      if (index !== -1) {
        this.dataPermissionIds['divisionId'].splice(index, 1);
      }
    }
  }
}

  // get data restrictions
  getDataforTree() {
    let body = {}
    this.userApi.getDataforDataRestrictions(body).subscribe((result: any) => {
      console.log("getDataforDataRestrictions",result);
      // inject data to datasource by calling initialize fn in first class 
      this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
      this.dataSourceTree = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
      this.database.initialize(result.Data);
      this.database.dataChange.subscribe(data => {
        this.dataSourceTree.data = data
      });

      //

    })
  }
  filterData: any = {
    locationId: [],
    departmentId: [],
    divisionId: [],
  };
  applyFilter() {
    // Assign the current selected IDs to the filterData
    this.filterData.locationId = this.dataPermissionIds['locationId'];
    this.filterData.departmentId = this.dataPermissionIds['departmentId'];
    this.filterData.divisionId = this.dataPermissionIds['divisionId'];
  
    // Close the dialog and return the filter data
    this.dialogeRef.close(this.filterData);
  
    // You can also log the filterData to verify
  }
  closeDialog() {
    this.dialogeRef.close()
  }

  // function to update checked status
  checkedStatus(node: any): boolean {
    if (!this.data?.callFilter) {
      console.error("callFilter is undefined or null");
      return false;
    }

    switch (node.level) {
      case 0:
        return this.data.callFilter.inLocationId?.includes(node.locationId) ?? false;
      case 1:        
        return this.data.callFilter.inDepartmentId?.includes(node.departmentId) ?? false;
      case 2:
        return this.data.callFilter.inDivisionId?.includes(node.divisionId) ?? false;
      default:
        console.error("Invalid node level:", node.level);
        return false;
        
    }
    
  }
 
}
