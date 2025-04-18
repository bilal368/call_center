import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { Component, Injectable } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { RolesAndPrivilegesService } from '../../core/services/rolesAndPrivileges/roles-and-privileges.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../../shared/dialogComponents/alert-dialog/alert-dialog.component';
import { ResourceLoader } from '@angular/compiler';
/**
 * Node for to-do item
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
  checked?: boolean
  intermediate?: boolean
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

/**
 * The Json object for to-do list data.
 */
/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<TodoItemNode[]>([]);
  dataChangeHierarchy = new BehaviorSubject<TreeNode[]>([]);

  get data(): TodoItemNode[] { return this.dataChange.value; }
  get dataHierarchy(): TodoItemNode[] { return this.dataChangeHierarchy.value; }

  constructor() {
  }

  initialize(TreeData: any) {
    // Build the tree nodes from Json object  . The result is a list of `TodoItemNode` with nested
    //     file node as children.
    const data = this.buildFileTree(TreeData, 0);
    console.log(data)
    // Notify the change.
    this.dataChange.next(data);
  }
  initializeHierarchy(TREE_DATA_2: any) {
    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as children.
    const data = this.transformForTree(TREE_DATA_2);
    // Notify the change.
    this.dataChangeHierarchy.next(data);
  }
  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `TodoItemNode`.
   */
  buildFileTree(obj: any, level: number = 0): TodoItemNode[] {
    return Object.keys(obj).reduce<TodoItemNode[]>((accumulator, key) => {
      const value = obj[key];
      let node: TodoItemNode;

      // If the value is a number, create a node with the key as the item
      if (typeof value === 'number') {
        node = new TodoItemNode();
        node.item = key;
        node.id = value;
        node.checked = false
        node.intermediate = false
      } else {
        node = new TodoItemNode();
        node.item = key;

        // If the value is an object, recursively build the subtree
        if (value != null && typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1);
        }
      }

      // Add the node to the accumulator array
      return accumulator.concat(node);
    }, []);
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


  updateItem(node: TodoItemNode, name: string) {
    node.item = name;
    this.dataChange.next(this.data);
  }
}

@Component({
  selector: 'app-roles-and-priv-setting',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, MatCheckboxModule, MatIconModule, MatExpansionModule, MatListModule, MatTreeModule,
    TranslateModule, MatTooltipModule
  ],
  providers: [ChecklistDatabase],
  templateUrl: './roles-and-priv-setting.component.html',
  styleUrl: './roles-and-priv-setting.component.css'
})
export class RolesAndPrivSettingComponent {



  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();

  searchString = ''

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();

  /** A selected parent node to be inserted */
  selectedParent: TodoItemFlatNode | null = null;

  /** The new item's name */
  newItemName = '';

  treeControl: FlatTreeControl<TodoItemFlatNode>;

  treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;

  privDataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;


  // tree hierarchy
  treeControlHierarchy: FlatTreeControl<TodoItemFlatNode>;
  treeFlattenerHierarchy: MatTreeFlattener<TreeNode, TodoItemFlatNode>;
  dataHierarchy: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;
  flatNodeMapHierarchy = new Map<TodoItemFlatNode, TreeNode>();
  nestedNodeMapHierarchy = new Map<TreeNode, TodoItemFlatNode>();

  /** The selection for checklist */
  checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);

  constructor(private database: ChecklistDatabase,
    private userApi: RolesAndPrivilegesService,
    private router: Router,
    private dialogRef: MatDialog,
  ) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
      this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
    this.privDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this.treeFlattenerHierarchy = new MatTreeFlattener(this.transformerHierarchy, this.getLevel,
      this.isExpandable, this.getChildrenHierarchy);
    this.treeControlHierarchy = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataHierarchy = new MatTreeFlatDataSource(this.treeControlHierarchy, this.treeFlattenerHierarchy);

    database.dataChange.subscribe(data => {
      this.privDataSource.data = data;

      this.treeControl.expand(this.treeControl.dataNodes[0])
    });
    database.dataChangeHierarchy.subscribe(data => {
      this.dataHierarchy.data = data;

      this.treeControlHierarchy.expand(this.treeControlHierarchy.dataNodes[0])
    });
  }

  getLevel = (node: TodoItemFlatNode) => node.level;

  isExpandable = (node: TodoItemFlatNode) => node.expandable;

  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;
  getChildrenHierarchy = (node: TreeNode): TreeNode[] => node.children;

  hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.item === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TodoItemNode, level: number) => {

    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.item === node.item
      ? existingNode
      : new TodoItemFlatNode();
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.id = node?.id;
    flatNode.expandable = !!node.children;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }
  // flattner for hierary

  transformerHierarchy = (node: TreeNode, level: number) => {



    const existingNode = this.nestedNodeMapHierarchy.get(node);
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
    this.flatNodeMapHierarchy.set(flatNode, node);
    this.nestedNodeMapHierarchy.set(node, flatNode);
    return flatNode;
  }


  // search filter logic start
  filterLeafNode(node: TodoItemFlatNode): boolean {
    if (!this.searchString) {
      return false
    }
    return node.item.toLowerCase()
      .indexOf(this.searchString?.toLowerCase()) === -1

  }

  filterParentNode(node: TodoItemFlatNode): boolean {

    if (
      !this.searchString ||
      node.item.toLowerCase().indexOf(this.searchString?.toLowerCase()) !==
      -1
    ) {
      return false
    }
    const descendants = this.treeControl.getDescendants(node)

    if (
      descendants.some(
        (descendantNode) =>
          descendantNode.item
            .toLowerCase()
            .indexOf(this.searchString?.toLowerCase()) !== -1
      )
    ) {
      return false
    }

    return true
  }
  // search filter logic end

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.length > 0 && descendants.every(child => {
      return this.checklistSelection.isSelected(child);
    });
    return descAllSelected;
  }
  descendantsAllSelectedHierarchy(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControlHierarchy.getDescendants(node);
    const descAllSelected = descendants.length > 0 && descendants.every(child => {
      return this.checklistSelection.isSelected(child);
    });
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }
  /** Whether part of the descendants are selected */
  descendantsPartiallySelectedHierarchy(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControlHierarchy.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelectedHierarchy(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.forEach(child => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }
  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggleHierarchy(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControlHierarchy.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }
  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggleHierarchy(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelectionHierarchy(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: TodoItemFlatNode): void {
    let parent: TodoItemFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }
  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelectionHierarchy(node: TodoItemFlatNode): void {
    let parent: TodoItemFlatNode | null = this.getParentNodeHierarchy(node);
    while (parent) {
      this.checkRootNodeSelectionHierarchy(parent);
      parent = this.getParentNodeHierarchy(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: TodoItemFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.length > 0 && descendants.every(child => {
      return this.checklistSelection.isSelected(child);
    });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }
  /** Check root node checked state and change it accordingly in Hierarchy */
  checkRootNodeSelectionHierarchy(node: TodoItemFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControlHierarchy.getDescendants(node);
    const descAllSelected = descendants.length > 0 && descendants.every(child => {
      return this.checklistSelection.isSelected(child);
    });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: TodoItemFlatNode): TodoItemFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }


  /* Get the parent node of a node */
  getParentNodeHierarchy(node: TodoItemFlatNode): TodoItemFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControlHierarchy.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControlHierarchy.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }
  private subscription: Subscription = new Subscription(); //variable for unsubscribe on ngDestroy
  arrayOfUsers: {} = {};


  ngOnInit(): void {
    this.getUsersAndRoles();

  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  // function for get users and roles
  getUsersAndRoles() {
    let body = {}
    const sub = this.userApi.getUsersByPrivileages(body).subscribe((res: any) => {

      // containing features data and data permissions in each user/group
      this.arrayOfUsers = res.data;
    }, (Error) => {
      console.log("Error:", Error);
      if (Error.status === 403) {
        // opens dialog for logout message
        this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true })
      }
      else if (Error.status === 401) {
        this.router.navigateByUrl('')
        // this.dialogRef.open(LogoutSpinnerComponent,{data:{clickedType:'logOut'}})
      }
    })
    this.subscription.add(sub);
  }


  filteredArrayOfUsers: any[] = [];
  filteredUsers: any[] = [];
  searchMatchItem: boolean = false;
  Users: any = []
  selectedUserGroup: string | null = null;
  selectedUser: any | null = null;
  // Search User/group
  searchUsers(search: HTMLInputElement) {
    this.filteredArrayOfUsers.length = 0;
    this.filteredUsers.length = 0
    const searchTerm = search.value.trim().toLowerCase();

    // Log the search term for debugging

    // Filter user groups
    this.filteredArrayOfUsers = Object.entries(this.arrayOfUsers).filter(([key, group]: [string, any]) => {
      // Check if the group key matches the search term
      const keyMatches = key.toLowerCase().includes(searchTerm);

      // Check if any user in the group matches the search term
      const usersMatch = group.users?.some((user: any) =>
        user.name.toLowerCase().includes(searchTerm) ||
        (user.accessPermission || '').toLowerCase().includes(searchTerm)
      );

      // If there's a match, return the group
      return keyMatches || usersMatch;
    });

    // Flatten users from the filtered groups
    this.filteredArrayOfUsers = this.filteredArrayOfUsers.map(([key, group]: [string, any]) => ({
      groupName: key,
      users: group.users,
    }));

    // Filter the overall users list
    this.filteredUsers = this.Users.filter((user: any) =>
      user.name.toLowerCase().includes(searchTerm) ||
      (user.accessPermission || '').toLowerCase().includes(searchTerm)
    );

    // this.selectedUserGroup = userGroupKey.key;
    if (this.filteredArrayOfUsers.length > 0) {
      this.selectedUser = null;
      this.selectedUserGroup = this.filteredArrayOfUsers[0].groupName
      this.searchMatchItem = true
      // this.selectUserGroup(this.filteredArrayOfUsers[0])

    }
    if (this.filteredUsers.length > 0) {
      this.selectedUserGroup = null;
      this.selectedUser = this.filteredUsers[0].name
      this.searchMatchItem = true

      // this.selectUser(this.filteredUsers[0])
    }
  }

  // selected status in UI
  isUserGroupSelected(userGroupKey: string): boolean {

    return this.selectedUserGroup === userGroupKey;

  }
  // selected status in UI
  isUserSelected(user: any): boolean {

    return this.selectedUser === user.name;
  }

  // function for select user group in roles
  selectUserGroup(userGroupKey: any) {
    // console.log(userGroupKey, this.packageFeatureTabPermissionId, this.privileageOfOne);
    this.Users = userGroupKey.value.users //setting array for expansion panel
    this.requestData = {
      type: 'group',
      id: 0,
      groupName: '',
      privileageData: userGroupKey.value.featuresRole,
      hierarchy: {},
      alarmsAlerts: []
    };

    this.requestData.groupName = userGroupKey.key
    // reset array for users
    if (this.privileageOfOne) {
      this.privileageOfOne.length = 0;
    }
    this.checklistSelection.clear();
    this.getFeatures()
    this.getDataRestrictions();
    if (this.selectedUserGroup === userGroupKey.key) {
      this.featureDataStatus = false;
      this.selectedUserGroup = null;  // Deselect if the same group is clicked
    } else {
      this.selectedUserGroup = userGroupKey.key;
      this.bodyForPrivileageOfUser.user = null
      this.bodyForPrivileageOfUser.group = userGroupKey.key
      if (this.arrayForGroupProcess.length > 0) {
        console.log("arrayForGroupProcess not null", this.arrayForGroupProcess);
        const existingIndex = this.arrayForGroupProcess.findIndex((item: any) => item.groupName === this.requestData.groupName);
        if (existingIndex === -1) {
          console.log('not found');
          this.privileageOfOne = userGroupKey.featuresRole
          this.packageFeatureTabPermissionId = userGroupKey.value.featuresRole//copy array using spread operator
          this.dataPermission = userGroupKey.value.accessPermission
          if (this.dataPermission) {
            this.dataPermissionIds = { ...this.separateIdsFromString(this.dataPermission) }

          }

          // not found
        } else {
          console.log("found");
          // Update data from  arrayForGroupProcess
          this.privileageOfOne = this.arrayForGroupProcess[existingIndex].privileageData ||[] ;
        }
      }
      // call fn for get privieage id that already set on table
      else {
        this.privileageOfOne = [...userGroupKey.value?.featuresRole]
        this.packageFeatureTabPermissionId = [...userGroupKey.value?.featuresRole]
        this.featureDataStatus = true;
        // console.log(typeof (userGroupKey.value.accessPermission));

        this.dataPermission = userGroupKey.value.accessPermission

        // call function for take id in each groups from accessPermission string
        if (this.dataPermission) {
          this.dataPermissionIds = { ...this.separateIdsFromString(this.dataPermission) }

        }
        // console.log(this.dataPermissionIds);

        // console.log("arrayForGroupProcess null");
      }
      this.selectedUser = null;  // Clear selected user when a new group is selected
    }
    // console.log(this.packageFeatureTabPermissionId, this.privileageOfOne);

  }
  // variables for take data of users/group that is already set in db
  dataPermission: string = ''

  dataPermissionIds: { [categoryId: string]: number[] } = {
    locationId: [],
    departmentId: [],
    divisionId: [],
    userId: [],
    extensionNumber: []
  };
  locationId: [] = [];
  departmentId: [] = [];
  divisionId: [] = [];
  userId: [] = [];
  sortedUsers: { key: string, value: string[] }[] = [];
  featureDataStatus: boolean = false
  // checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);

  packageFeatureTabPermissionId: number[] = [];
  hierarchyData: {} = {} //for showing hierarchy in Data Restrictions
  bodyForPrivileageOfUser: any = {} //body for get privileage id of user/group
  privileageOfOne: any[] = [] //rivileage id of user/group
  newArray: [] = []
  requestData: any = {}; //body defined above
  arrayForGroupProcess: any = [] //array contains multiple group/users input

  selectUser(user: any) {

    // Initialize `dataPermission` and `dataPermissionIds`
    if (user.accessPermission) {
      this.dataPermission = user.accessPermission;
      this.dataPermissionIds = { ...this.separateIdsFromString(this.dataPermission) };
    } else {
      this.dataPermission = '';
      this.dataPermissionIds = {};
    }

    console.log('this.dataPermissionIds', this.dataPermissionIds);

    // Prepare request data
    this.requestData = {
      type: 'user',
      id: user.userId,
      groupName: '',
      privileageData: user.featuresUser,
      hierarchy: this.dataPermissionIds,
      alarmsAlerts: [],
    };

    // Clear selection and reset UI states
    this.checklistSelection.clear();
    this.getFeatures();
    this.getDataRestrictions();

    if (this.selectedUser === user.name) {
      // Deselect if the same user is clicked
      this.selectedUser = null;
      this.featureDataStatus = false;
      return;
    }

    // Handle new user selection
    this.selectedUser = user.name;
    this.featureDataStatus = true;
    this.selectedUserGroup = null;

    // Prepare body for API call
    this.bodyForPrivileageOfUser.group = null;
    this.bodyForPrivileageOfUser.user = user.userId;

    if (this.arrayForGroupProcess.length > 0) {
      const existingIndex = this.arrayForGroupProcess.findIndex(
        (item: any) => item.id === this.requestData.id
      );

      if (existingIndex === -1) {
        // If user is not in the array
        console.log('not found');
        this.privileageOfOne = user.features;
        this.packageFeatureTabPermissionId = [...user.features];
      } else {
        // If user is already in the array
        console.log('found');
        this.privileageOfOne = this.arrayForGroupProcess[existingIndex].privileageData || [];
      }
    } else {
      // Handle when `arrayForGroupProcess` is empty
      this.privileageOfOne = user.features || [];
      this.packageFeatureTabPermissionId = [...(user.features || [])];      
      this.dataPermission = user.accessPermission || '';
      this.dataPermissionIds = { ...this.separateIdsFromString(this.dataPermission) };
    }

    // Ensure all selected nodes are marked as checked
    this.treeControl.dataNodes.forEach((node) => {
      if (this.personalizeData(node)) {
        this.checklistSelection.select(node);
      }
    });

    // 🔄 Force recalculation of parent selection states after data loads
    setTimeout(() => {
      this.treeControl.dataNodes.forEach((node) => {
        this.descendantsAllSelected(node);
        this.descendantsPartiallySelected(node);
      });
      console.log("🔄 Recalculated tree selection states on load.");
    }, 0);
  }
  // function for take id in each groups from accessPermission string
  separateIdsFromString(idString: string): { [categoryId: string]: number[] } {
    // Remove parentheses and leading/trailing whitespace (optional)
    const trimmedString = idString.trim().slice(1, -1); // Remove surrounding parentheses
    // Split by "OR" (or "AND") keywords (considering both)
    const parts = trimmedString.length > 0 ? trimmedString.split(/OR|AND/i) : []; // Split only if there's content

    // Extract category and convert IDs to integers
    const idArrays: { [categoryId: string]: number[] } = {
      locationId: [], // Use camelCase for consistency (optional)
      departmentId: [],
      divisionId: [],
      extensionNumber: [],
    };

    for (const part of parts) {
      // Extract category and ID string (handle empty parts gracefully)
      const [category, idsStr] = part.trim().split("IN(");
      const categoryId = category.trim();; // No conversion to lowercase

      if (!idsStr) {
        idArrays[categoryId] = []; // Set an empty array for missing IDs
        continue; // Skip to the next part
      }

      // Convert IDs to integers
      idArrays[categoryId] = idsStr.slice(0, -1).split(",").map((id: any) => parseInt(id, 10));
    }


    return idArrays;
  }
  // function for patch already selcted id of privileages 
  // with available privileages
  personalizeData(node: any): boolean {
    if (this.privileageOfOne != null) {
      return this.privileageOfOne.includes(node.id);
    }
    else {
      return false
    }
  }
  // get Features
  getFeatures() {
    let body = {};
    this.userApi.getFeatures(body).subscribe((res: any) => {
      // Initialize tree control and data source again
      this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
      this.privDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

      // Inject the fetched data
      this.database.initialize(res.data);
      this.database.dataChange.subscribe(data => {
        this.privDataSource.data = data;

        // ✅ Apply pre-selected checkboxes
        setTimeout(() => {
          this.applyPreselectedNodes();
        }, 0);
      });
    }, (Error) => {
      console.error("Error fetching features:", Error);
      if (Error.status === 403) {
        this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true });
      } else if (Error.status === 401) {
        this.router.navigateByUrl('');
      }
    });
  }
  applyPreselectedNodes() {
    if (!this.privileageOfOne || this.privileageOfOne.length === 0) {
      return;
    }


    this.treeControl.dataNodes.forEach(node => {
      if (this.privileageOfOne.includes(node.id)) {
        this.checklistSelection.select(node);
      }
    });

    // 🔄 Force recalculation of parent selection states
    this.treeControl.dataNodes.forEach(node => {
      this.updateParentSelectionState(node);
    });

  }
  updateParentSelectionState(node: TodoItemFlatNode): void {
    let parent = this.getParentNode(node);

    while (parent) {
      const descendants = this.treeControl.getDescendants(parent);
      const allSelected = descendants.every(child => this.checklistSelection.isSelected(child));

      if (allSelected) {
        this.checklistSelection.select(parent);
      } else {
        this.checklistSelection.deselect(parent);
      }

      parent = this.getParentNode(parent);
    }
  }

  // get data restrictions
  getDataRestrictions() {
    let body = {}
    this.userApi.getDataforDataRestrictions(body).subscribe((result: any) => {
      console.log(result);

      // inject data to datasource by calling initialize fn in first class 
      this.treeControlHierarchy = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
      this.dataHierarchy = new MatTreeFlatDataSource(this.treeControlHierarchy, this.treeFlattenerHierarchy);
      this.database.initializeHierarchy(result.Data);
      this.database.dataChangeHierarchy.subscribe(data => {
        this.dataHierarchy.data = data
      });
    })
    // ✅ Apply pre-selected checkboxes
    setTimeout(() => {
      this.applyPreselectedNodesInHierarchy();
    }, 0);


    //

  }
  applyPreselectedNodesInHierarchy() {
    if (!this.privileageOfOne || this.privileageOfOne.length === 0) {
      return;
    }


    this.treeControlHierarchy.dataNodes.forEach(node => {
      if (this.privileageOfOne.includes(node.id)) {
        this.checklistSelection.select(node);
      }
    })


    // 🔄 Force recalculation of parent selection states
    this.treeControlHierarchy.dataNodes.forEach(node => {
      this.updateParentSelectionStateInHierarchy(node);
    });
  }
  // apply pre selected nodes
  personalizeDataHierarchy(node: any): boolean {
    let id;
    let status: boolean;
    if (node.locationId) {
      id = node.locationId;
      status = this.dataPermissionIds?.['locationId']?.includes(id) ? true : false
    } else if (node.departmentId) {
      id = node.departmentId;
      status = this.dataPermissionIds?.['departmentId']?.includes(id) ? true : false
    } else if (node.divisionId) {
      id = node.divisionId;
      status = this.dataPermissionIds?.['divisionId']?.includes(id) ? true : false
    } else if (node.extensionNumber) {
      id = node.extensionNumber;

      status = this.dataPermissionIds?.['extensionNumber']?.includes(id) ? true : false
    } else {
      status = false
    }
    return status;
  }
  // save function
  saveRolesAndPrivileges() {
    console.log("Array for save", this.arrayForGroupProcess);

    if (this.arrayForGroupProcess.length > 0) {

    }
    // saving whole privileges data restrictions
    this.userApi.saveRolesAndPrivileages(this.arrayForGroupProcess).subscribe((result: any) => {

      if (result.status = true) {
        this.arrayForGroupProcess.length = 0
        this.getUsersAndRoles();
        let message = 'Menu.CONFIGURE.ROLES & PRIVILEGES.Changes were saved successfully.'
        this.dialogRef.open(AlertDialogComponent, {
          disableClose: true,
          width: '350px',
          height: '190px',
          data: {
            message: message,
            clickedStatus: 'rolesAndPrivileagesSaved'
          }
        })
      }

    }, (Error) => {
      console.error(Error)
    })

  }

  onCheckboxChange(node: TodoItemFlatNode, event: MatCheckboxChange): void {

    if (node.expandable) {
      // If parent node, select/deselect all children
      const descendants = this.treeControl.getDescendants(node);

      if (event.checked) {
        this.checklistSelection.select(node);
        this.checklistSelection.select(...descendants);
      } else {
        this.checklistSelection.deselect(node);
        this.checklistSelection.deselect(...descendants);
      }
    } else {
      // If leaf node, just toggle its state
      if (event.checked) {
        this.checklistSelection.select(node);
      } else {
        this.checklistSelection.deselect(node);
      }
    }

    // 🔄 Update the parent selection state
    this.updateParentSelectionState(node);

    // 🔄 Update the `packageFeatureTabPermissionId` array
    this.updatePackageFeaturePermissions();
    console.log('changed and calling syncGroupProcess');

    this.syncGroupProcess()
  }

  updatePackageFeaturePermissions(): void {
    this.packageFeatureTabPermissionId = this.treeControl.dataNodes
      .filter(node => this.checklistSelection.isSelected(node) && node.id !== undefined) // Ensure node.id is valid
      .map(node => node.id);
    this.requestData.privileageData = [...this.packageFeatureTabPermissionId];
    console.log("✅ Updated `packageFeatureTabPermissionId`:", this.packageFeatureTabPermissionId);
  }
  syncGroupProcess(): void {
    const existingIndex = this.arrayForGroupProcess.findIndex(
      (item: any) =>
        item.type === this.requestData.type && // Ensure type matches
        (item.id === this.requestData.id || item.groupName === this.requestData.groupName)
    );

    if (existingIndex === -1) {
      this.arrayForGroupProcess.push(this.requestData);
    } else {
      this.arrayForGroupProcess[existingIndex].privileageData = [...this.packageFeatureTabPermissionId];
    }

    // console.log('this.requestData', this.requestData);
    // console.log('Body', this.arrayForGroupProcess);
  }

  onCheckboxChangeHierarchy(node: any, event: MatCheckboxChange): void {
    // load changed json to DOM
    // adding to ids

    if (node.expandable === false) {
      if (event.checked === true) {
        this.todoItemSelectionToggleHierarchy(node)
        if (node.level == 0) {
          this.dataPermissionIds['locationId'].push(node.locationId)
        }
        else if (node.level == 1) {
          this.dataPermissionIds?.['departmentId'].push(node.departmentId)
        }
        else if (node.level == 2) {
          this.dataPermissionIds?.['divisionId'].push(node.divisionId)
        }
        else {

          this.dataPermissionIds?.['extensionNumber'].push(node.extensionNumber)

        }
        if (node.id && node.id !== 0) {
        }
      }
      // removng ids
      else {


        if (node.level == 0) {
          const index = this.dataPermissionIds['locationId'].indexOf(node.locationId)
          if (index !== -1) {
            this.dataPermissionIds['locationId'].splice(index, 1);
          }

        }
        else if (node.level == 1) {
          const index = this.dataPermissionIds['departmentId'].indexOf(node.departmentId)
          if (index !== -1) {
            this.dataPermissionIds['departmentId'].splice(index, 1);
          }
        }
        else if (node.level == 2) {
          const index = this.dataPermissionIds['divisionId'].indexOf(node.divisionId)
          if (index !== -1) {
            this.dataPermissionIds['divisionId'].splice(index, 1);
          }
        }
        else {
          const index = this.dataPermissionIds['extensionNumber'].indexOf(node.extensionNumber)
          if (index !== -1) {
            this.dataPermissionIds['extensionNumber'].splice(index, 1);
          }

        }
        if (node.id && node.id !== 0) {
        }
      }
    } else {
      // if node is expandable
      // Main logic for handling descendants
      const descendants = this.treeControlHierarchy.getDescendants(node);
      // console.log('descendants', descendants);
      this.dataPermissionIds['locationId'].push(node.locationId)
      if (event.checked === true) {
        descendants.forEach((descendant: any) => {
          this.updatePermissionIds(descendant, node.level, 'add');
        });
      } else {
        descendants.forEach((descendant: any) => {
          this.updatePermissionIds(descendant, node.level, 'remove');
        });
      }
      // Assuming requestData has an 'id' property of a suitable type (e.g., number, string)
      if (this.requestData.type === 'user') {
        console.log("type ==user in request data", this.requestData);

        const existingIndex = this.arrayForGroupProcess.findIndex((item: any) => item.id === this.requestData.id);

        if (existingIndex == -1) {
          console.log("not found in arrayForGroupProcess");
          this.requestData.hierarchy = this.dataPermissionIds
          this.arrayForGroupProcess.push(this.requestData);
        } else {

          console.log("found in arrayForGroupProcess,need to update requestData");

          // Update existing data in arrayForGroupProcess
          this.arrayForGroupProcess[existingIndex].hierarchy = this.dataPermissionIds
        }

      } else {
        console.log("type ==group in request data", this.requestData);

        const existingIndex = this.arrayForGroupProcess.findIndex((item: any) => item.groupName === this.requestData.groupName);
        if (existingIndex == -1) {
          this.requestData.hierarchy = this.dataPermissionIds
          this.arrayForGroupProcess.push(this.requestData);
        } else {
          // Update existing data in arrayForGroupProcess
          this.arrayForGroupProcess[existingIndex].hierarchy = this.dataPermissionIds
        }

      }
    }
    this.updateParentSelectionStateInHierarchy(node);
  }

  // Helper function to add or remove IDs based on the level in hierarchy on change checkbox
  updatePermissionIds(descendant: any, nodeLevel: number, action: 'add' | 'remove') {
    console.log('updatePermissionIds', descendant, nodeLevel);

    const mapping: Record<number, string[]> = {
      0: ['locationId', 'departmentId', 'divisionId', 'extensionNumber'],
      1: ['departmentId', 'divisionId', 'extensionNumber'],
      2: ['divisionId', 'extensionNumber'],
      3: ['extensionNumber'],
    };

    const keys = mapping[nodeLevel] || [];
    keys.forEach((key) => {
      const value = descendant[key];
      if (value !== null && value !== undefined) {
        if (action === 'add') {
          if (!this.dataPermissionIds[key]?.includes(value)) {
            this.dataPermissionIds[key]?.push(value);
          }
        } else if (action === 'remove') {
          const index = this.dataPermissionIds[key]?.indexOf(value);
          if (index !== -1) {
            this.dataPermissionIds[key]?.splice(index, 1);
          }
        }
      }
    });
  }
  updateParentSelectionStateInHierarchy(node: TodoItemFlatNode): void {
    let parent = this.getParentNodeHierarchy(node);

    while (parent) {
      const descendants = this.treeControlHierarchy.getDescendants(parent);
      const allSelected = descendants.every(child => this.checklistSelection.isSelected(child));

      if (allSelected) {
        this.checklistSelection.select(parent);
      } else {
        this.checklistSelection.deselect(parent);
      }

      parent = this.getParentNodeHierarchy(parent);
    }
  }
}