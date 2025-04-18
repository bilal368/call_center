import { Injectable } from '@angular/core';
import { AuthService } from '../authentication/auth.service';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RouteProtectService {

  constructor(private authService:AuthService,private router: Router) { }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):any{
    const ids=this.getIds()
      // function to set UI
    const input=route.data['privileges']; //object to array
    const hasAccess = input.some((item: number) => {
      return ids?.includes(item)
    })
    if (!hasAccess) {
    this.router.navigateByUrl('/dG');
    
      return this.router.parseUrl(this.router.url); // navigate back to the current route
    }

    return hasAccess;
  
    
  }
  getIds(){
    const token=localStorage.getItem('token')
    return this.authService.extractDataFromToken(token).combinedPackageID

  }
}
