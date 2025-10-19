import { ChangeDetectionStrategy, Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, combineLatest, BehaviorSubject, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { EmployeeService } from '../../shared/services/employee.service';
import { TranslationService } from '../../shared/services/translation.service';
import { AuthService } from '../../shared/services/auth.service';
import { IEmployee, IPosition } from '../../shared/interfaces/employee.interface';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  employees$: Observable<IEmployee[]>;
  positions$: Observable<IPosition[]>;
  isAdmin$: Observable<boolean>;
  
  private sortBySubject = new BehaviorSubject<string>('last_name');
  private filterPositionSubject = new BehaviorSubject<string>('all');

  filteredEmployees$: Observable<IEmployee[]>;

  positionsWithCount$: Observable<{position: IPosition, count: number}[]>;

  translationsLoaded = false;
  private translationsSubscription: Subscription;

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    public translationService: TranslationService
  ) {
    this.positions$ = this.employeeService.getPositions();
    this.employees$ = this.employeeService.getEmployees();
    this.isAdmin$ = this.authService.isLoggedIn();

    this.positionsWithCount$ = combineLatest([
      this.positions$,
      this.employees$.pipe(startWith([] as IEmployee[]))
    ]).pipe(
      map(([positions, employees]) => {
        return positions.map(position => ({
          position,
          count: employees.filter(emp => emp.position_id === position.id).length
        }));
      })
    );

    this.filteredEmployees$ = this.createFilteredEmployees();

    this.translationsSubscription = this.translationService.getTranslationsLoadedObservable()
      .subscribe(loaded => {
        this.translationsLoaded = loaded;
        if (loaded) {
          console.log('Translations loaded in employee list');
        }
      });
  }

  public ngOnInit(): void {
    this.filterPositionSubject.next('all');
  }

  public ngOnDestroy(): void {
    if (this.translationsSubscription) {
      this.translationsSubscription.unsubscribe();
    }
  }

  private createFilteredEmployees(): Observable<IEmployee[]> {
    return combineLatest([
      this.employees$.pipe(startWith([] as IEmployee[])),
      this.sortBySubject,
      this.filterPositionSubject
    ]).pipe(
      map(([employees, sortBy, filterPosition]) => {
        let filtered = [...employees];

        if (filterPosition && filterPosition !== 'all') {
          filtered = filtered.filter(emp =>
            emp.position_id === parseInt(filterPosition)
          );
        }

        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'last_name':
              return a.last_name.localeCompare(b.last_name);
            case 'position':
              return (a.position_name || '').localeCompare(b.position_name || '');
            default:
              return 0;
          }
        });

        return filtered;
      })
    );
  }

  public onSortChange(sortBy: string): void {
    this.sortBySubject.next(sortBy);
  }

  public onPositionFilterChange(positionId: string): void {
    this.filterPositionSubject.next(positionId);
  }

  public resetFilters(): void {
    this.filterPositionSubject.next('all');
    this.sortBySubject.next('last_name');
  }
}