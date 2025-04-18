import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search',
  standalone: true
})
export class SearchPipe implements PipeTransform {
  transform(adminList:any[], searchKey:string,propertyName:string): any {
    const result:any = []
    if(!adminList|| searchKey==''|| propertyName==''){
      return adminList
    }
    adminList.forEach((admin:any)=>{
      if(admin[propertyName].trim().toLowerCase().includes(searchKey.trim().toLowerCase())){
        result.push(admin)
      }
    })
    return result;
  } 

}
