import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse,
  Slider,
  Button,
  Autocomplete,
  Tooltip,
  Badge,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TuneOutlined as TuneIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DateRange as DateIcon,
  LocationOn as LocationIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
// Removed MUI Date Pickers dependency

export interface FilterOptions {
  searchTerm: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  severity: string[];
  sources: string[];
  locations: string[];
  types: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  intensityRange: [number, number];
}

interface SearchAndFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  availableOptions: {
    sources: string[];
    locations: string[];
    types: string[];
  };
  resultCount?: number;
  showAdvanced?: boolean;
}

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'critical', label: 'Critical', color: 'error' }
] as const;

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'severity', label: 'Severity' },
  { value: 'source', label: 'Source' }
];

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onFilterChange,
  availableOptions,
  resultCount,
  showAdvanced = true
}) => {
  const theme = useTheme();
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    dateRange: { start: null, end: null },
    severity: [],
    sources: [],
    locations: [],
    types: [],
    sortBy: 'date',
    sortOrder: 'desc',
    intensityRange: [0, 100]
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      searchTerm: '',
      dateRange: { start: null, end: null },
      severity: [],
      sources: [],
      locations: [],
      types: [],
      sortBy: 'date',
      sortOrder: 'desc',
      intensityRange: [0, 100]
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.severity.length > 0) count++;
    if (filters.sources.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.types.length > 0) count++;
    if (filters.intensityRange[0] > 0 || filters.intensityRange[1] < 100) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Card sx={{ mb: 2 }}>
        <CardContent>
          {/* Search Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search articles, events, locations..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: filters.searchTerm && (
                  <IconButton
                    size="small"
                    onClick={() => updateFilters({ searchTerm: '' })}
                  >
                    <ClearIcon />
                  </IconButton>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: searchFocused ? theme.palette.action.hover : 'transparent',
                  transition: 'background-color 0.2s'
                }
              }}
            />
            
            {showAdvanced && (
              <Button
                variant="outlined"
                startIcon={
                  <Badge badgeContent={activeFilterCount} color="primary">
                    <TuneIcon />
                  </Badge>
                }
                endIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                sx={{ minWidth: 120 }}
              >
                Filters
              </Button>
            )}
          </Box>

          {/* Quick Filter Chips */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {SEVERITY_OPTIONS.map((severity) => (
              <Chip
                key={severity.value}
                label={severity.label}
                color={filters.severity.includes(severity.value) ? severity.color : 'default'}
                variant={filters.severity.includes(severity.value) ? 'filled' : 'outlined'}
                onClick={() => {
                  const newSeverity = filters.severity.includes(severity.value)
                    ? filters.severity.filter(s => s !== severity.value)
                    : [...filters.severity, severity.value];
                  updateFilters({ severity: newSeverity });
                }}
                size="small"
              />
            ))}
            
            {hasActiveFilters && (
              <Chip
                label="Clear All"
                variant="outlined"
                color="error"
                size="small"
                onClick={clearAllFilters}
                icon={<ClearIcon />}
              />
            )}
          </Box>

          {/* Advanced Filters */}
          <Collapse in={showAdvancedFilters}>
            <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon />
                Advanced Filters
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
                {/* Date Range */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DateIcon fontSize="small" />
                    Date Range
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="From"
                      type="date"
                      size="small"
                      fullWidth
                      value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                      onChange={(e) => updateFilters({ 
                        dateRange: { 
                          ...filters.dateRange, 
                          start: e.target.value ? new Date(e.target.value) : null 
                        } 
                      })}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="To"
                      type="date"
                      size="small"
                      fullWidth
                      value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                      onChange={(e) => updateFilters({ 
                        dateRange: { 
                          ...filters.dateRange, 
                          end: e.target.value ? new Date(e.target.value) : null 
                        } 
                      })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Box>

                {/* Sources */}
                <FormControl size="small" fullWidth>
                  <InputLabel>Sources</InputLabel>
                  <Select
                    multiple
                    value={filters.sources}
                    onChange={(e) => updateFilters({ sources: e.target.value as string[] })}
                    input={<OutlinedInput label="Sources" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {availableOptions.sources.map((source) => (
                      <MenuItem key={source} value={source}>
                        <Checkbox checked={filters.sources.indexOf(source) > -1} />
                        <ListItemText primary={source} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Locations */}
                <Autocomplete
                  multiple
                  options={availableOptions.locations}
                  value={filters.locations}
                  onChange={(event, newValue) => updateFilters({ locations: newValue })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        icon={<LocationIcon />}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Locations"
                      size="small"
                      placeholder="Select locations..."
                    />
                  )}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                {/* Article Types */}
                <FormControl size="small" fullWidth>
                  <InputLabel>Article Types</InputLabel>
                  <Select
                    multiple
                    value={filters.types}
                    onChange={(e) => updateFilters({ types: e.target.value as string[] })}
                    input={<OutlinedInput label="Article Types" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" icon={<ArticleIcon />} />
                        ))}
                      </Box>
                    )}
                  >
                    {availableOptions.types.map((type) => (
                      <MenuItem key={type} value={type}>
                        <Checkbox checked={filters.types.indexOf(type) > -1} />
                        <ListItemText primary={type} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Sort Options */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={filters.sortBy}
                      label="Sort By"
                      onChange={(e) => updateFilters({ sortBy: e.target.value })}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Order</InputLabel>
                    <Select
                      value={filters.sortOrder}
                      label="Order"
                      onChange={(e) => updateFilters({ sortOrder: e.target.value as 'asc' | 'desc' })}
                    >
                      <MenuItem value="desc">Newest</MenuItem>
                      <MenuItem value="asc">Oldest</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Intensity Range */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Conflict Intensity Range: {filters.intensityRange[0]}% - {filters.intensityRange[1]}%
                </Typography>
                <Slider
                  value={filters.intensityRange}
                  onChange={(event, newValue) => updateFilters({ intensityRange: newValue as [number, number] })}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
          </Collapse>

          {/* Result Count */}
          {resultCount !== undefined && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="body2" color="text.secondary">
                {resultCount} result{resultCount !== 1 ? 's' : ''} found
                {hasActiveFilters && ` with ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} applied`}
              </Typography>
              
              {hasActiveFilters && (
                <Button
                  size="small"
                  color="error"
                  onClick={clearAllFilters}
                  startIcon={<ClearIcon />}
                >
                  Clear All Filters
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
  );
};

export default SearchAndFilter;